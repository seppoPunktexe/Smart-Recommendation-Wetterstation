// gets current date 
var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

today = dd + '/' + mm + '/' + yyyy;
// convert epochtime to JavaScripte Date object
function epochToJsDate(epochTime){
    return new Date(epochTime*1000);
  }
  
  // convert time to human-readable format YYYY/MM/DD HH:MM:SS
  function epochToDateTime(epochTime){
    var epochDate = new Date(epochToJsDate(epochTime));
    var dateTime = epochDate.getFullYear() + "/" +
      ("00" + (epochDate.getMonth() + 1)).slice(-2) + "/" +
      ("00" + epochDate.getDate()).slice(-2) + " " +
      ("00" + epochDate.getHours()).slice(-2) + ":" +
      ("00" + epochDate.getMinutes()).slice(-2) + ":" +
      ("00" + epochDate.getSeconds()).slice(-2);
  
    return dateTime;
  }
  
  // DOM elements
  const loginElement = document.querySelector('#login-form');
  const contentElement = document.querySelector("#content-sign-in");
  const userDetailsElement = document.querySelector('#user-details');
  const authBarElement = document.querySelector('#authentication-bar');
  
  // DOM elements for sensor readings

  const tempElement = document.getElementById("temp");
  const humElement = document.getElementById("hum");
  const presElement = document.getElementById("pres");
  const updateElement = document.getElementById("lastUpdate");

  const tempTrend = document.getElementById("temptrend");
  const humTrend = document.getElementById("humtrend");
  const presTrend = document.getElementById("prestrend");
  
  const recCon = document.getElementById("recCon");
  const recClo = document.getElementById("recClo");
  const recUmb = document.getElementById("recUmb");
  const date = document.getElementById("date");
  
  const ctx1 = document.getElementById("tempchart");
  const ctx2 = document.getElementById("humchart");
  const ctx3 = document.getElementById("preschart");

  
  

  // MANAGE LOGIN/LOGOUT UI
  const setupUI = (user) => {
    if (user) {
      console.log("gen");
      //toggle UI elements
      loginElement.style.display = 'none';
      contentElement.style.display = 'block';
      authBarElement.style.display ='block';
      userDetailsElement.style.display ='block';
      userDetailsElement.innerHTML = user.email;
  
      // get user UID to get data from database
      var uid = user.uid;
      console.log(uid);
  
      // Database paths (with user UID)
      var dbPath = 'UsersData/' + uid.toString() + '/readings';
      var dbPath1 = 'UsersData/' + uid.toString();
      
  
      // Database references
      var dbRef = firebase.database().ref(dbPath);
      var dbRef1 = firebase.database().ref(dbPath1);
      
      // Pressure trend
      var pres_Trend;

      // GENERATE TRENDS
      function genTrend(oldData, newData){

        var old_temperature = oldData.temperature;
        var old_humidity = oldData.humidity;
        var old_pressure = oldData.pressure;

        var temperature = newData.temperature;
        var humidity = newData.humidity;
        var pressure = newData.pressure;

        if (old_temperature > temperature) {
          tempTrend.className = "fa-solid fa-arrow-down";
        } else if (old_temperature == temperature) {
          tempTrend.className = "fa-solid fa-arrow-right-long";
        } else {
          tempTrend.className = "fa-solid fa-arrow-up";
        }
        if (old_humidity > humidity) {
          humTrend.className = "fa-solid fa-arrow-down";
        }else if(old_humidity == humidity){
          humTrend.className = "fa-solid fa-arrow-right-long";
        } else {
          humTrend.className = "fa-solid fa-arrow-up";
        }
        if (old_pressure > pressure) {
          presTrend.className = "fa-solid fa-arrow-down";
          pres_Trend ="do";
        }else if(old_pressure == pressure){
          presTrend.className = "fa-solid fa-arrow-right-long";
          pres_Trend ="eq";
        } else {
          presTrend.className = "fa-solid fa-arrow-up";
          pres_Trend ="up";
        }

      }
     
      // GENERATE RECOMMENDATIONS
      function genRecommendation(data, pres_Trend){
        date.innerHTML = today
        var condition;
        var clothing;
        var umbrella;

        if (data.temperature <= 10){
          condition = "Kalt";
          clothing = "Dicke Jacke";
        }else if (data.temperature > 10 && data.temperature < 20 ){
          condition = "Mild";
          clothing = "leichte Jacke und Sweatshirt";
          if(data.humidity>60){
            condition = "Mild und vielleicht Regen";
            clothing = "Regenjacke und Sweatshirt";
          }
        }else if (data.temperature > 20){
          condition = "Warm";
          clothing = "T-Shirt";
          if(data.humidity>60){
            condition = "Warm mit hoher Luftfeuchte";
            clothing = "Atmungsaktive Kleidung";
          }
        }

        if (pres_Trend == "up"){
          umbrella = "geringe Wahrscheinlichkeit";
        }else if (pres_Trend == "eq"){
          umbrella = "mittlere Wahrscheinlichkeit";
        }else if (pres_Trend == "do"){
          umbrella = "Wahrscheinlich";
        }
      
        recCon.innerHTML = condition;
        recClo.innerHTML = clothing;
        recUmb.innerHTML = umbrella;


        // writes recommendation to database
        firebase.database().ref('UsersData/' + uid.toString() + '/readings/'+data.timestamp).set({
            temperature: data.temperature,
            humidity: data.humidity,
            pressure: data.pressure,
            timestamp: data.timestamp,
            recommendation: {
              "condition" : condition,
              "clothing" : clothing,
              "umbrella" : umbrella
            }
        }); 
      }

      // ADDS DATA TO CHART
      function addData(chart, label, data) {
        chart.data.labels.push(label);
        chart.data.datasets.forEach((dataset) => {
            dataset.data.push(data);
        });
        chart.update();
      }
  
      // GETS ALL DATA FROM DATABASE FOR THE CHART
      dbRef.orderByKey().on('child_added', snapshot => {
        var data1 = snapshot.toJSON();
        var temperatured = data1.temperature;
        var humidityd = data1.humidity;
        var pressured = data1.pressure;
        var timestampd = data1.timestamp;
        addData(tempchart,epochToDateTime(timestampd), temperatured);
        addData(humchart,epochToDateTime(timestampd), humidityd);
        addData(preschart,epochToDateTime(timestampd), pressured);

        genRecommendation(data1, pres_Trend);

      });
     
      var bool = true;
      var oldJsonData;
      var newJsonData;

      // GETS THE LAST TWO ENTRIES FOR TREND
      dbRef.orderByKey().limitToLast(2).on('child_added', snapshot =>{ 
        var jsonData = snapshot.toJSON();
        if (bool){
          oldJsonData = jsonData;
          bool = false;
        }else{
          newJsonData = jsonData;
          bool = true;
        }
        if (newJsonData != null){
          genTrend(oldJsonData, newJsonData);
        }
       
      });
      
      // GETS THE LAST ENTRY FOR DISPLAY 
      dbRef.orderByKey().limitToLast(1).on('child_added', snapshot =>{
        var jsonData = snapshot.toJSON(); // example: {temperature: 25.02, humidity: 50.20, pressure: 1008.48, timestamp:1641317355}
        var temperatured = jsonData.temperature;
        var humidityd = jsonData.humidity;
        var pressured = jsonData.pressure;
        var timestampd = jsonData.timestamp;
        // Update DOM elements
        tempElement.innerHTML = temperatured;
        humElement.innerHTML = humidityd;
        presElement.innerHTML = pressured;
        updateElement.innerHTML = epochToDateTime(timestampd);

        data1 = jsonData;

        genRecommendation(jsonData, pres_Trend);
      });
   
     // CHARTS
       var tempchart = new Chart(ctx1, {
          type: 'line',
          data: {
            labels: [],
            datasets: [{
              label: 'Temperatur',
              data: [],
              borderColor: '#059e8a',
              borderWidth: 2
            }]
          },
          options: {

            
          }
        });

      
      var humchart = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Luftfeuchtigkeit',
            data: [],
            borderColor: '#00add6',
            borderWidth: 2
          }]
        },
        options: {

          
        }
      });
      var preschart = new Chart(ctx3, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Luftdurck',
            data: [],
            borderColor: '#e1e437',
            borderWidth: 2
          }]
        },
        options: {

          
        }
      });
      
    // IF USER IS LOGGED OUT
    } else{
      // toggle UI elements
      loginElement.style.display = 'block';
      authBarElement.style.display ='none';
      userDetailsElement.style.display ='none';
      contentElement.style.display = 'none';
    }
  }

