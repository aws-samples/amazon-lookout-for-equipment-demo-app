const AWS = require("aws-sdk");
const ResponseHandler = require("./response-handler");
const S3Handler = require("./s3-handler");

exports.handler = (event, context, callback) => {
    console.log('=====================================')
    console.log('Event: ---')
    console.log(event)
    console.log('Context: ---')
    console.log(context)
    console.log('Callback: ---')
    console.log(callback)
    console.log('=====================================')
    
    const { copyFiles, removeFiles, writeSettings } = S3Handler(new AWS.S3());
    const { sendResponse } = ResponseHandler(event, context, callback);

    const eventType = event.RequestType;
    let actions;

  if (eventType === "Create") {
    console.log("### Creating resources");
    actions = [copyFiles(), writeSettings()];
  }
  else if (eventType === "Update") {
    console.log("### Updating resources");
    actions = [copyFiles(), writeSettings()];
  }
  else if (eventType === "Delete") {
    console.log("### Deleting resources");
    actions = [removeFiles()];
  }

  Promise.all(actions)
    .then(() => {
      console.log("All actions successfully performed");
      return sendResponse("SUCCESS", {
        Message: `Resources successfully ${eventType.toLowerCase()}d`
      });
    })
    .catch(err => console.log(err) || sendResponse("FAILED"));

    return sendResponse("SUCCESS");
};
