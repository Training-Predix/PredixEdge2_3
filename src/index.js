// load the mqtt package so we can communicate with the app containers
var mqtt = require('mqtt')

//the opc-ua tag we will look for to scale
//var tagName = 'My.App.DOUBLE1';

console.log("app starting");

//connect to the predix-edge-broker - use an environment variable if devloping locally
var predix_edge_broker = process.env.predix_edge_broker || 'predix-edge-broker';

console.log("mqtt connecting to " + predix_edge_broker);
var client  = mqtt.connect('mqtt://' + predix_edge_broker);

client.on('connect', function () {
  console.log("connected to "+ predix_edge_broker);
  //subscribe to the topic being published by the opc-ua container
  client.subscribe('app_data');
});

//handle each message as it is recieved
client.on('message', function (topic, message) {

  console.log("message recieved from "+predix_edge_broker+" : " + message.toString());

  //add your app logic all goes below here

  //read the message into a json object
  var item = JSON.parse(message);

  //if the item is equal to the tagName we are looking for then scale up the value by 1000 and put it back on the broker to be sent to timeseries
  for ( var i=0;i<item.body.length;i++)
  {
      var tagName = item.body[i].name;
      var value = item.body[i].datapoints[0][1];

      //scale the tag value * 1000
      item.body[i].datapoints[0][1] = value * 100;

      //give the scaled tag a new name
      //item.body[0].name = tagName + '.scaled_x_1000';

      var scaled_item = JSON.stringify(item);

      //publish the tag back to the broker on the topic the cloud-gateway container is subscribing to
      client.publish("timeseries_data", scaled_item);

      console.log("published scaled item to predix-edge-broker: " + scaled_item);
  }
});
