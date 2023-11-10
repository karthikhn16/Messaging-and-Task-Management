const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message');
var currentUser=""
var userArray=[ 'john_doe123','susan_smith456','michael_jackson789']
var taskArray=[]
var taskfrom=[]
var recipientMessages=[]
var taskonly=[]



const Messagedb = mongoose.model('Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/chat_app');

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


app.get('/', (req, res) => {
    res.render('loginandsignup');
});

var taskschema = new mongoose.Schema({
  from:String,
  task:String,
  to:String
})
var taskmodel= new mongoose.model("Taskdb",taskschema)

app.get('/tasks', (req, res) => {

  taskmodel.find({ to: currentUser }).select('task from').lean().then(tasks => {
    taskArray = tasks.map(task => ({ task: task.task, from: task.from }));
    taskonly=tasks.map(task => ({ task: task.task }));
    console.log("Illi nodu:",taskonly)
    console.log(taskArray);
    console.log(taskfrom);
    res.render('Task', { currentUser, users:userArray, tasklist:taskArray});
  }).catch(err => {
    console.error(err);
  });
  
});


app.post("/taskcomp",(req,res)=>{
  const selectedCheckboxes = req.body.checkboxValues || [];

    console.log('Selected Checkboxes:', selectedCheckboxes);
    taskonly = taskonly.filter(item => !selectedCheckboxes.includes(item));

    
    res.redirect("/")
})


var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    confirmpassword: String
  });
  var User =  new mongoose.model('UserRegistrationforTask', userSchema);

  User.find({}).then(data => {
    userArray = data.map(item => item.name);
   console.log(userArray);
}).catch(error => {
   console.error(error);
});

app.post('/register-login', (req, res) => {


    var newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmpassword: req.body.confirmpassword
      });
    currentUser=newUser.name
    console.log("current user is",currentUser)
      // Save the user data to the database
      newUser.save()
      .then(() => {
        console.log("User saved successfully");
        
      })
      .catch((err) => {
        console.error("Error saving user:", err);
        res.status(500).send("Error saving user");
      });
      console.log(newUser)


    res.redirect('/');
});



app.post("/postlogin", async function(req,res)
{
  const name= req.body.name;
  const password=req.body.password;
  currentUser=name
  const messages = await Message.find().sort({ createdAt: 'asc' });
  recipientMessages = await Messagedb.find({ recipient:currentUser });
  const status = true

  try {
    const user = await User.findOne({ name, password });
    
    if (user) {
      console.log(user)
      
        res.send(status)
        
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  }
   catch (error) {
    res.status(500).json({ message: error.message });
  }

 
})
  
                                    // DATABASE FOR TASKS


app.post("/posttasksubmission", async function(req,res)
{ 
  var newtask= new taskmodel({
    from:currentUser,
    task:req.body.taskdata,
    to:req.body.to  
});

newtask.save().then(() => {
  console.log("Task saved successfully");
  
})
.catch((err) => {
  console.error("Error saving Task:", err);
  res.status(500).send("Error saving Task");
});

  res.redirect("/")

});


app.get("/inbox",function(req,res)
{
  res.render("Inbox",{ messages: recipientMessages})
})
app.get("/about",function(req,res)
{
  res.redirect("/")
})

app.get('/register-login', async (req, res) => {

    try {
        const messages = await Message.find().sort({ createdAt: 'asc' });

        const Messagedb = mongoose.model('Message');

        console.log(recipientMessages)

        res.render('home', { currentUser, users:userArray, messages: recipientMessages });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId}`);
    userArray[userId] = socket.id;
    console.log(socket.id)

    socket.on('message', async (data) => {
        const { message, recipient } = data;
        const sender = userId;
        console.log(sender)

        const newMessage = new Message({ sender, recipient, message });
        await newMessage.save();

        if (recipient === 'all') {
            io.emit('message', { message, sender, recipient: 'all' });
        } else {
            const recipientSocketId = userArray[recipient];
            console.log(recipientSocketId)
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('message', { message, sender, recipient });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
        delete userArray[userId];
    });
});





const port = 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})
