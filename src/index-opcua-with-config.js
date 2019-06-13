// load the mqtt package so we can communicate with the app containers
var mqtt = require('mqtt')
var fs = require('fs');
var config_file_name = '/config/config-my-opcua-app.json';

console.log("app starting");

// read config file
let configObj;
try {
   configObj = JSON.parse(fs.readFileSync(config_file_name));
} catch (err) {
   console.log("Error reading config file " + config_file_name);
   console.log(err);
   return;
}

// Read the values for subSubject pubSubject and tagName from the config file
let subTopic = configObj.my_opcua_app.config.subTopic;
let pubTopic = configObj.my_opcua_app.config.pubTopic;
let multiplier = configObj.my_opcua_app.config.multiplier;

console.log("config file " + config_file_name + "read and parsed");
console.log("subTopic=" + subTopic + ", pubTopic=" + pubTopic + ", multiplier=" + multiplier);
//connect to the predix-edge-broker - use an environment variable if devloping locally
var predix_edge_broker = process.env.predix_edge_broker || 'predix-edge-broker';

console.log("mqtt connecting to " + predix_edge_broker);
var client  = mqtt.connect('mqtt://' + predix_edge_broker);

client.on('connect', function () {
  console.log("connected to "+ predix_edge_broker);
  // subscribe to the topic being published by the opc-ua container
  client.subscribe(subTopic);
});

//handle each message as it is recieved
client.on('message', function (topic, message) {

  console.log("message recieved from " + predix_edge_broker+" : " + message.toString());

  // read the message into a json object
  var item = JSON.parse(message);

  // Extract the value from the OPCUA Flat data object
  // message format:
  // {"body":[ {"attributes": {"device_id" : "Predix_Edge_Device_ID"},
  //            "datapoints": [[22525242343243,44,3]],
  //            "name"      : "Timeseries_Tag_Name" }
  //         ],
  //  "messageID":"flex-pipe"}
  let value;
  try {
    value = item.body[0].datapoints[0][1];
  } catch (err) {
    console.log("Could not get data value from received item");
    console.log(err);
    return;
  }

  //scale tagName's value * multiplier value from config file
  let newValue = value * multiplier;
  item.body[0].datapoints[0][1] = newValue;

  // Stringify the object for publishing
  var scaled_item = JSON.stringify(item);

  //publish the OPCUA object back to the broker on the topic that
  //the cloud-gateway container is subscribing to
  client.publish(pubTopic, scaled_item);

  console.log("published scaled item to predix-edge-broker: " + scaled_item);
});
