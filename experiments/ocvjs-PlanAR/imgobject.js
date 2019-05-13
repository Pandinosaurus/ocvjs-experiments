// High level interface for opencv cv.Mat
// with extended properties and methods
class ImgObject {
  constructor(imgwidth=100, imgheight=100) { 
    this.img = new cv.Mat(imgheight, imgwidth, cv.CV_8UC4);
    this.keypoints = new cv.KeyPointVector();
    this.descriptors = new cv.Mat();
    this.imgcorners = new cv.Mat();
  }; //constructor

  toJSON(){
     return JSON.stringify({
       __type__:'ImgObject',  // name of class
       __args__:[this.img, 
                 this.keypoints,
                 this.descriptors,
                 this.imgcorners] // same args that construct
     });
  }; //toJSON

  setImg(img) { 
    this.img = img; 
  }; //setImg

  setKeypoints(keypoints) { 
    this.keypoints = keypoints 
  }; //setKeypoints

  setDescriptors(descriptors) { 
    this.descriptors = descriptors; 
  }; //setDescriptors

  computeOrbKeypoints(features=10000){
    if(this.img.empty()) { 
        return; 
    }
    var orb = new cv.ORB(features, //nb of features 
                         1.2,      //scale decimation between 2 lvl of the pyramid
                         8,        //nb of lvls (scales) in the pyramid
                         10,       //offset from image border
                         1,        //lvl of input img in pyr, higher levels are uspamled
                         ); 
    orb.detect(this.img, 
               this.keypoints, 
               new cv.Mat());

    if(this.keypoints.size() > 0){
        orb.compute(this.img, 
                    this.keypoints, 
                    this.descriptors);
        this.descriptors.convertTo(this.descriptors, 
                                   cv.CV_32F); //for flann based matching
    }
    orb.delete();

    //console.log(this.keypoints.size());

    return;
  }; //computeOrbKeypoints

  computeImgCorners()
  {
    if(this.img){
        if(!this.img.empty()){
            if(this.img.rows > 0 && 
               this.img.cols > 0){
                var corners = new cv.Mat(4,1, cv.CV_32FC2);
                corners.floatPtr(0, 0)[0] = 0; //(row, col)[channel]
                corners.floatPtr(0, 0)[1] = 0;
                corners.floatPtr(1, 0)[0] = this.img.cols;
                corners.floatPtr(1, 0)[1] = 0;
                corners.floatPtr(2, 0)[0] = this.img.cols;
                corners.floatPtr(2, 0)[1] = this.img.rows;
                corners.floatPtr(3, 0)[0] = 0;
                corners.floatPtr(3, 0)[1] = this.img.rows;
                this.imgcorners = corners;
            } else{ console.log('Error in computeImgCorners from ImgObect: ',
                                'img.rows < 0 || img.cols < 0.'); }
        } else{ console.log('Error in computeImgCorners from ImgObect: ',
                            'img is empty().'); }
    } else{ console.log('Error in computeImgCorners from ImgObect: ',
                        'img is undefined.'); }
    return;
  }; //computeImgCorners
};