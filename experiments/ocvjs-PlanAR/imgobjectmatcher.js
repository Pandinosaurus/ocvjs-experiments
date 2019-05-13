// High level interface to match images
// represented with high level ImgObject(s)
class ImgObjectMatcher {
    constructor(scene = new ImgObject(), 
                reference = new ImgObject()) { 
        this.imgObjectScene = scene;
        this.imgObjectReference = reference;
        this.matcher = new cv.DescriptorMatcher("FlannBased");
        this.kmatches = new cv.DMatchVectorVector();
        this.k = 1;
    }; //constructor

    toJSON(){
         return JSON.stringify({
           __type__:'ImgObjectMatcher',  // name of class
           __args__:[this.imgObjectScene, 
                     this.imgObjectReference,
                     this.matcher,
                     this.kmatches,
                     this.k] // same args that construct
         });
     }; //toJSON

    setImgObjectScene(scene = new ImgObject()){
        this.imgObjectScene = scene;        
        if(!this.imgObjectScene.img.empty()){
            this.imgObjectScene.computeOrbKeypoints();
        }
    }; //setImgObjectScene

    setImgObjectReference(reference = new ImgObject()){
        this.imgObjectReference = reference;
        if(!this.imgObjectReference.img.empty()){
            this.imgObjectReference.computeOrbKeypoints(); 
        }
    }; //setImgObjectReference
    
    // Find an homography between two image objects using
    // their inner vector of 'keypoints' and 'descriptors'.
    getHomographyBetweenImageObjects() {
        var H = new cv.Mat();
        var points = this.matchKeypoints();
        if(!points[0].empty() &&
           !points[1].empty()){
            H = cv.findHomography(points[0], points[1], cv.RANSAC);
        }
        return H;
    }; //getHomographyBetweenImageObjects

    // Match with ratio test
    matchKeypoints() {
        if(this.kmatches){
            delete this.kmatches;
            this.kmatches = new cv.DMatchVectorVector();
        } 

        if(this.imgObjectScene.descriptors.rows > 0 &&
           this.imgObjectReference.descriptors.rows > 0) {
                this.matcher.knnMatch(this.imgObjectScene.descriptors, 
                                      this.imgObjectReference.descriptors, 
                                      this.kmatches,
                                      this.k);
         }

        return this.performRatioTestOnKmatches();
    };//matchKeypoints

    performRatioTestOnKmatches(maxDist=300, ratio=0.85) {
        if( this.k <= 0 || 
            this.kmatches.size() <= 0 ) {
            return [new cv.Mat(), new cv.Mat()]; 
        }
        else if( this.k >= 1 ) { // actually perform the test
            var row            = 0; // nb of rows <=> nb good matches
            var PointReference = new cv.Mat(this.kmatches.size(), 
                                            1,
                                            cv.CV_32FC2); //C1:x, C2:y
            var PointScene     = new cv.Mat(this.kmatches.size(), 
                                            1,
                                            cv.CV_32FC2);
            for(var i = 0; i < this.kmatches.size(); i++) {
                var distance_first  = this.kmatches.get(i).get(0)['distance'];
                var distance_second = -1;
                if(this.k >= 2) { 
                    distance_second = this.kmatches.get(i).get(1)['distance'];
                }
                if(distance_first < maxDist &&
                   (this.k == 1 || 
                    distance_first < ratio*distance_second)) {
                    var referenceIdx = this.kmatches.get(i).get(0).trainIdx;
                    PointReference.floatPtr(row, 0)[0] =  //[row,col](channel)
                        this.imgObjectReference.keypoints.get(referenceIdx)['pt']['x'];
                    PointReference.floatPtr(row, 0)[1] = 
                        this.imgObjectReference.keypoints.get(referenceIdx)['pt']['y'];
                    
                    var sceneIdx = this.kmatches.get(i).get(0).queryIdx;
                    PointScene.floatPtr(row, 0)[0] = 
                        this.imgObjectScene.keypoints.get(sceneIdx)['pt']['x'];
                    PointScene.floatPtr(row, 0)[1] = 
                        this.imgObjectScene.keypoints.get(sceneIdx)['pt']['y'];   
                    row += 1;
                }
            }
            var rect = new cv.Rect(0,0,1,row);
            return [PointReference.roi(rect),
                    PointScene.roi(rect)];        
        }
    }; //performRatioTest1Matches
};