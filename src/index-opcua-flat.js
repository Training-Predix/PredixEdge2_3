// load the mqtt package so we can communicate with the app containers
var mqtt = require('mqtt')

console.log("app starting");

// connect to the predix-edge-broker - use an environment variable if
// developing locally
var predix_edge_broker = process.env.predix_edge_broker || 'predix-edge-broker';

console.log("mqtt connecting to " + predix_edge_broker);
var client  = mqtt.connect('mqtt://' + predix_edge_broker);

client.on('connect', function () {
  console.log("connected to "+ predix_edge_broker);
  //subscribe to the topic being published by the opc-ua container
  //*** EDIT THIS to the correct subscripe topic ***
  client.subscribe('subscribe-topic');
});

// handle each message as it is recieved
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
  
  // scale tagName's value * 100
  let value = item.body[0].datapoints[0][1];
  item.body[0].datapoints[0][1] = value * 100;

  // Stringify the object for publishing 
  var scaled_item = JSON.stringify(item);

  // publish the OPCUA object back to the broker on the topic that
  // the cloud-gateway container is subscribing to
  // *** EDIT THIS: Put the topic your timeseries cloud gateway expects
  //                to receive here ***
  client.publish("timeseries_data", scaled_item);

  console.log("published scaled item to predix-edge-broker: " + scaled_item);
});
