// Video input handling (HTML5)
class Camera {
  constructor(startStopButton = null, 
              video = null) {
    this.streaming = false;
    this.startStopButton = startStopButton;
    console.log(this.startStopButton.innerText);
    this.video = video; 
    this.constraints = {
        'qvga': {width: {exact: 320}, 
                 height: {exact: 240}},
        'vga': {width: {exact: 640}, 
                height: {exact: 480}}
    }; //constraints
  }; //constructor
  
  startCamera(resolution='qvga') {
    let videoConstraint = this.constraints[resolution];
    console.log(videoConstraint);
    if (!videoConstraint) {
        videoConstraint = true;
    }
    navigator.mediaDevices.getUserMedia({video: videoConstraint, 
                                         audio: false})
        .then(stream => {
            this.video.srcObject = stream;
            this.video.play();
            this.streaming = true;
            this.startStopButton.innerText = 'Stop';
         }) //navigator - .then
        .catch(function(err) {
            console.log('Camera Error: ' + err.name + ' ' + err.message);
        }) //catch(function(err))
  }; //startCamera
  
  stopCamera() {
    if (this.video) {
        this.video.pause();
        this.video.srcObject = null;
        this.streaming = false;
        this.startStopButton.innerText = 'Start';
    } //if (video)
  }; //stopCamera

}; //class Camera