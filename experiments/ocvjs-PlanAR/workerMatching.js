//todo https://stackoverflow.com/questions/31953296/how-to-pass-custom-class-instances-through-web-workers
self.importScripts('opencv/opencv.js',
                   'imgobject.js',
                   'imgobjectmatcher.js');

let cvloaded = false;
cv.onRuntimeInitialized = async () => {
    console.log('OpenCV runtime loaded');
    cvloaded = true;
    setTimeout(init, 1000);
}; //onRuntimeInitialized

let sceneObject     = null;
let referenceObject = null;
let matcher         = null;
let corners         = null;
let initialized     = false;
let referenceSet    = false;
function init(){
    if(cvloaded == true){
      sceneObject     = new ImgObject(320, 
                                      240);
      referenceObject = new ImgObject(245, 156);
      matcher = new ImgObjectMatcher();
      corners = new cv.Mat();
      initialized = true;
    }
}; //init

function matCorners2Object(corners){
    var object = { 'x0': corners.floatPtr(0,0)[0],
                   'y0': corners.floatPtr(0,0)[1],
                   'x1': corners.floatPtr(1,0)[0],
                   'y1': corners.floatPtr(1,0)[1],
                   'x2': corners.floatPtr(2,0)[0],
                   'y2': corners.floatPtr(2,0)[1],
                   'x3': corners.floatPtr(3,0)[0],
                   'y3': corners.floatPtr(3,0)[1]
    };
    return object;
}; //corners2array


self.addEventListener('message', ({ data }) => {
    if(initialized == false){
        init();
        return;
    }
    switch (data.type) {
    case 'reference':
        try{
            //if(!referenceSet){
                referenceObject.setImg(cv.matFromImageData(data.referenceData));
                referenceObject.computeImgCorners();        
                matcher.setImgObjectReference(referenceObject);
                referenceSet = true;
            //}
        } 
        catch(e){
            console.log('Error in workerMatching.js. ',
                        'Occured on addEventListener message, case reference. ',
                        'Log :', e);
        }
        break;

    case 'frame':
        try{
            sceneObject.setImg(cv.matFromImageData(data.frameData));
            matcher.setImgObjectScene(sceneObject);
            var H = matcher.getHomographyBetweenImageObjects();
            if(!H.empty()){
                var corners = new cv.Mat();
                cv.perspectiveTransform(matcher.imgObjectReference.imgcorners, 
                                        corners,
                                        H);
                self.postMessage({type: 'corners', corners: matCorners2Object(corners) });
                corners.delete();
            }
            else{ console.log('EMPTY H'); }
        }
        catch(e){
            console.log('Error in workerMatching.js. ',
                        'Occured on addEventListener message, case frame. ',
                        'Log :', e);
        }
        break;
    };
}); //message event listener