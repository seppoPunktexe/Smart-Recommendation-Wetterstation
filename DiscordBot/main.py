import os
import discord
import pyrebase
from datetime import datetime
from discord.ext import commands


# Id from the Discord Channel it should post in 
target_channel_id = 00000000000000

# Firebase config 
config = {
    "apiKey": "#######################################",
  "authDomain": "wetterstation-c49dc.firebaseapp.com",
  "databaseURL": "https://wetterstation-c49dc-default-rtdb.europe-west1.firebasedatabase.app/UsersData/5uV83k2j4ugYQicKp44AnA84SSr1",
  "projectId": "wetterstation-c49dc",
  "storageBucket": "wetterstation-c49dc.appspot.com",
  "messagingSenderId": "613964763799",
  "appId": "1:613964763799:web:7867b326ac5de913600fd2",
  "measurementId": "G-XK9XPL7ERK"
}

# Firebase initialization 
firebase = pyrebase.initialize_app(config)

# Get a reference to the auth service
auth = firebase.auth()

# Log the user in with Email and Password
user = auth.sign_in_with_email_and_password("###############", "############") 

# Get a reference to the Database
db = firebase.database()

# Read the Data from Database
data = db.child("/readings").order_by_key().limit_to_last(1).get(user['idToken']).val().values()

# Converts it in Python list 
datax = list(data)[0]

# Reads recommendation Data from it
recData = datax['recommendation']

# Gets Discord Bot Token and makes a reference to Bot (Save token in secret!)
my_secret = os.environ['token']
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='>', intents=intents)

# Command to ping the Bot
@bot.command()
async def ping(ctx):
    await ctx.send('pong')

# Command to embed weather data and post it in the Channel  
@bot.command()
async def wetter(ctx):
  embed = discord.Embed(title="Das Aktuelle Wetter:", colour=discord.Colour(0x59e8a),timestamp= datetime.fromtimestamp(int(datax["timestamp"])))

  embed.set_thumbnail(url="https://www.hko.gov.hk/images/HKOWxIconOutline/pic61.png")
  embed.set_author(name="Wetterstation", url="https://wetterstation-c49dc.web.app")
  embed.set_footer(text="Last Update", icon_url="https://cdn.discordapp.com/embed/avatars/0.png")

  embed.add_field(name="Temperatur", value=datax["temperature"]+"°C")
  embed.add_field(name="Luftfeuchtigkeit", value=datax["humidity"]+"%")
  embed.add_field(name="Luftdruck", value=datax["pressure"]+"hPa")
  embed.add_field(name="Kleidungsempfehlung", value="Bedingung: "+ recData['condition']+ ", Kleidung: "+ recData['clothing']+ ", Regenschirm: "+ recData['umbrella'])
  await ctx.send(embed=embed)

# Run Discord Bot  
bot.run(my_secret)

