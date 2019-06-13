## This is the code that accompanies GE Digital's Training Course: Predix Edge Design & Connectivity Boot Camp
If you are viewing this README file outside of the context of the course, please contact <PredixTraining@ge.com> to inquire about the course materials.

## Predix Edge Sample Scaling App in Node.js

The intent of this app is to illustrate building and deploying a basic Predix Edge app that communicates with other common Predix Edge comtainer services.  The functionality is intended to be extremely simple with the focus being on the fundamentals of constructing the app.

The functionality of app is to subscribe to tag values that are being published to the data broker by a the OPC-UA protocol adapater.  The app then identifies a specific tag, scales the value by a defined factor, and puts the resulting tag value back on the data broker.  The Cloud Gateway service then picks of the scaled tag and publishes it to the Predix Cloud Timeseries service.

#### Software You will Need

You will need a subscription to Predix Edge Manager, the *UAA URL*, *TimeSeries Zone*, and a copy of the Predix Edge OS for VMWare.  All of these things can be obtained from your trainer.  

#### A description of the files included
Predix Edge apps contain a series of configration files to define parameters for the app's deployment and execution.  Our app contains the following configuration files.

#### docker-compose.yml
App deployment parameters are defined in the **docker-compse.yml** file.  This file defines the Docker images used to construt the application.  It also contains parameters for configuring the image, such as any  specific configuration files required by each image.

Some notes about the **docker-compose.yml** file:

- Predix Edge will automatically inject a **/config** and **/data** volume into your app at runtime.
- Apps running on a Predix Edge device will utilize the PROXY and DNS values configured on Predix Edge device.

#### Dockerfile
The file **Dockerfile** contains the instructions necessary for the Docker system to create a docker image from your application code.  The simple **Dockerfile** included starts with an Alpine Linux base image, then imports the application start file (index.js) and sets up the Node.js environment needed to run it.  The completed image is saved, and can be used as the basis for a docker container which will run on the Predix Edge device.

#### config/config-opcua.json
This configuration file is utilized by the OPC-UA Protocol Adapter image to connect to an OPC-UA server, subscribe to a series of 3 tags and publish the results on the data broker in a timersies format.  It is configured to use an OPC-UA simulator running on the GE network.  Unless you would like to connect to a different server or simulator, you should not have to change this file.

Below is a subset of the config file highlighting key properties you would change if obtaining data form a different OPC-UA server:

- **transport_addr** - the IP address or URL to the OPC-UA server
- **data_map** - the array of tags the app is subscribing to
- **node_ref** - in the mqtt section is the topic on which the OPC-UA data will be published to the data broker for consumption by the other containers in the app

```yaml
    "opcua": {
      "type": "opcuasubflat",
      "config": {
          "transport_addr": "opc-tcp://3.39.89.86:49310",
          "log_level": "debug",
          "data_map": [
            {
              "alias": "Timeseries_tag_name",
              "id": "ns=5;s=Counter1"
            }
         ]
      }

    "mqtt": {
        "type": "cdpoutqueue",
        "config": {
            "transport_addr": "mqtt-tcp://mosquitto",
            "node_ref": "opcua_data",
            "method": "pub",
            "log_level": "debug",
            "log_name": "opcua_mqtt",
            "directory": "/data/mqtt_queue",
            "max_cache_size_units": "%",
            "max_cache_size": 90
        }
```
#### config/config-cloud-gateway.json
This file is used by the Cloud Gateway service and contains properties indicating which Predix Cloud Timeseries service to inject the data.

- **transport_addr** - (in the timeseries section) is the websockets URL for your Predix Cloud Timeseries service.  Note, the Cloud Gateway container uses its own protocol prefixes for sending data to different destinations.  You are likely used to seeing this as wss://.  For this component, pstss:// should be the protocol prefix of the URL.  Everything else is exavlty as defined by your Predix Cloud timeseries service.
- **predix_zone_id** - (in the timeseries section) is the zone ID of the timeseries service you with to transmit the data to
- **node_ref** - (in the mqtt section) is the topic on which the Cloud Gateway service will subscribe to data published by the app to be injected into the timeseries database.  If you recall the sample app source code, **timeseries_data** is the topic to which the scaled values are put back on the broker.

**Action**: *You should change the value of **predix_zone_id** and ingestion URL to match the timeseries service to which you intend to publish data when running this sample.*

```yaml
    "mqtt": {
      "type": "cdpin",
      "config": {
        "transport_addr": "mqtt-tcp://predix-edge-broker",
        "node_ref": "timeseries_data",
        "method": "sub",
        "log_name":"gateway_mqtt_source",
        "log_level": "debug"
      }
    }

    "timeseries": {
      "type": "cdpoutqueue",
      "config": {
        "transport_addr": "pxtss://gateway-predix-data-services.run.aws-usw02-pr.ice.predix.io/v1/stream/messages",
        "node_ref": "timeseries",
        "method": "set",
        "log_name":"gateway_predix_sink",
        "log_level": "debug",
        "directory": "/data/store_forward_queue",
        "max_cache_size_units": "%",
        "max_cache_size": 90,
        "options": {
          "predix_zone_id": "54d53783-f868-4a3a-9a8e-a0d9a5d57299",
          "token_file": "/edge-agent/access_token",
          "proxy_url": "$https_proxy"
        }
      }
    }
```

