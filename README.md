/* बॉडी स्टाइल */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f9f9f9;
  overflow-x: hidden;
}

/* सर्कुलर मेन्यू कंटेनर */
.circle-menu-container {
  position: fixed;
  bottom: 120px;
  left: 90%;
  transform: translateX(-50%);
  z-index: 1000;
}

/* मेन्यू आइकॉन */
.menu-toggle {
  width: 60px;
  height: 60px;
  background-image: url('https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjCimrlajxAn2Uwtdk4zhE-krYms8rC43mB8SmoqopAHBi-Z0PFJXpqy1aQOmY9YNZ7ObzVj3P6CVVUa3n2Jkh_7qf9HneETZIjPBBVFcWp8KIiKU_YbHc6OFePFoxFV39OSCS8XazIpYrK711-1ekyU9cMehM6JAA8FChvAN6gaCeaaoIm2lY-DLi7pfql/s1929/IMG_1737386384948.png');
  background-size: cover;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s, box-shadow 0.3s;
}

.menu-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

/* सब-कैटेगरी मेन्यू */
.menu-categories {
  position: absolute;
  bottom: 80px;
  right: 50%;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 300px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 10px;
  transform: scale(0);
  transition: transform 0.4s ease, opacity 0.4s ease, visibility 0.4s ease;
  opacity: 0;
  visibility: hidden;
}

.menu-categories.active {
  transform: scale(1);
  opacity: 1;
  visibility: visible;
}

.menu-categories .category {
  width: 60px;
  height: 60px;
  background-color: #4caf50;
  color: #fff;
  font-size: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s, background-color 0.3s;
}

.menu-categories .category img {
  width: 60px;
  height: 60px;
  object-fit: contain; /* सुनिश्चित करें कि छवियां अपने कंटेनर के भीतर फिट हों */
}

.menu-categories .category:hover {
  transform: scale(1.2);
  background-color: #3d8f42;
}

/* लिंक बॉक्स */
.menu-links {
  position: absolute;
  bottom: 80px;
  right: 50%;
  transform: translateX(-50%);
  width: 300px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 15px;
  transform: scale(0);
  opacity: 0;
  visibility: hidden;
  max-height: 350px;
  overflow-y: auto;
  transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;
  display: none;
}

.menu-links.show {
  display: block;
  opacity: 1;
  visibility: visible;
  transform: scale(1);
}

.menu-links .links-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
}

.links-content a {
  display: flex;
  align-items: center;
  font-size: 1rem; /* 16px के बराबर */
  cursor: pointer;
  position: relative;
  color: #fff;
  transition: all 0.3s ease;
  text-shadow: 1px 1px 1px #000;
    margin-bottom:5px;
}

.links-content a::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    border-radius: 12px;
    filter: blur(0);
    z-index: -1;
    box-shadow: none;
      transition: all 0.3s ease;
  }

.links-content a:hover::before {
  filter: blur(15px);
}
.links-content a:active::before {
  filter: blur(5px);
  transform: translateY(1px);
}

.links-content a:active {
  box-shadow:
    inset 0px 0px 5px #ffffffa9,
    inset 0px 35px 30px #000;
  margin-top: 3px;
}

.links-content a img {
  width: 28px;
  height: 28px;
  margin-right: 10px;
  vertical-align: middle;
}

.links-content .links {
  display: none;
}

.links-content .outer-cont {
  padding: 12px 20px;
    border: none;
    font-size: 1rem;
  cursor: pointer;
  position: relative;
  background: linear-gradient(90deg, #5bfcc4, #f593e4, #71a4f0);
  border-radius: 12px;
  color: #fff;
  transition: all 0.3s ease;
  box-shadow:
    inset 0px 0px 5px #ffffffa9,
    inset 0px 35px 30px #000,
    0px 5px 10px #000000cc;
  text-shadow: 1px 1px 1px #000;
  display: flex;
  align-items: center;
    width:auto;
    justify-content: space-between;

}
.links-content .outer-cont::before {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  border-radius: 12px;
  filter: blur(0);
  z-index: -1;
  box-shadow: none;
  background: conic-gradient(
    #00000000 80deg,
    #40baf7,
    #f34ad7,
    #5bfcc4,
    #00000000 280deg
  );
  transition: all 0.3s ease;
}
.links-content .outer-cont:hover::before {
  filter: blur(15px);
}
.links-content .outer-cont:active::before {
  filter: blur(5px);
  transform: translateY(1px);
}
.links-content .outer-cont:active {
  box-shadow:
    inset 0px 0px 5px #ffffffa9,
    inset 0px 35px 30px #000;
  margin-top: 3px;
}


/* मैनुअल कलर प्रति लिंक */
.links-content .class-1-5 a:nth-child(1) { background: linear-gradient(90deg, #ffc107, #ff9800, #ff5722); }
.links-content .class-1-5 a:nth-child(2) { background: linear-gradient(90deg, #4caf50, #8bc34a, #cddc39); }

.links-content .class-6-8 a:nth-child(1) { background: linear-gradient(90deg, #e91e63, #9c27b0, #673ab7); }
.links-content .class-6-8 a:nth-child(2) { background: linear-gradient(90deg, #f44336, #e53935, #d32f2f); }
.links-content .class-6-8 a:nth-child(3) { background: linear-gradient(90deg, #03a9f4, #00bcd4, #009688); }
.links-content .class-6-8 a:nth-child(4) { background: linear-gradient(90deg, #9c27b0, #ba68c8, #e1bee7); }
.links-content .class-6-8 a:nth-child(5) { background: linear-gradient(90deg, #4caf50, #8bc34a, #cddc39); }
.links-content .class-6-8 a:nth-child(6) { background: linear-gradient(90deg, #ff9800, #ffc107, #ffeb3b); }
.links-content .class-6-8 a:nth-child(7) { background: linear-gradient(90deg, #8bc34a, #cddc39, #f0f4c3); }
.links-content .class-6-8 a:nth-child(8) { background: linear-gradient(90deg, #e91e63, #9c27b0, #673ab7); }

.links-content .class-9-10 a:nth-child(1) { background: linear-gradient(90deg, #ccffcc, #8bc34a, #4caf50); }
.links-content .class-9-10 a:nth-child(2) { background: linear-gradient(90deg, #ffffcc, #ffeb3b, #ffc107); }
.links-content .class-9-10 a:nth-child(3) { background: linear-gradient(90deg, #ffcccc, #e53935, #f44336); }
.links-content .class-9-10 a:nth-child(4) { background: linear-gradient(90deg, #ccffff, #009688, #00bcd4); }
.links-content .class-9-10 a:nth-child(5) { background: linear-gradient(90deg, #ffccff, #ba68c8, #9c27b0); }
.links-content .class-9-10 a:nth-child(6) { background: linear-gradient(90deg, #cc9999, #a1887f, #795548); }
.links-content .class-9-10 a:nth-child(7) { background: linear-gradient(90deg, #ffc107, #ff9800, #ff5722); }
.links-content .class-9-10 a:nth-child(8) { background: linear-gradient(90deg, #b0c4de, #90a4ae, #607d8b); }

.links-content .class-11-12 a:nth-child(1) { background: linear-gradient(90deg, #e91e63, #9c27b0, #673ab7); }
.links-content .class-11-12 a:nth-child(2) { background: linear-gradient(90deg, #00bcd4, #03a9f4, #009688); }

.links-content .competitive-exam a:nth-child(1) { background: linear-gradient(90deg, #4caf50, #8bc34a, #cddc39); }

.links-content .news-channel a:nth-child(1) { background: linear-gradient(90deg, #ff9800, #ffc107, #ffeb3b); }

.links-content .yoga-ayurveda a:nth-child(1) { background: linear-gradient(90deg, #00bcd4, #03a9f4, #009688); }
.links-content .yoga-ayurveda a:nth-child(2) { background: linear-gradient(90deg, #8bc34a, #cddc39, #f0f4c3); }
.links-content .yoga-ayurveda a:nth-child(3) { background: linear-gradient(90deg, #708090, #f593e4, #71a4f0); }

.links-content .marriage-links a:nth-child(1) { background: linear-gradient(90deg, #f44336, #e53935, #d32f2f); }
 .links-content .marriage-links a:nth-child(2) { background: linear-gradient(90deg, #795548, #a1887f, #d7ccc8); }

.links-content .editorial-links a:nth-child(1) { background: linear-gradient(90deg, #9c27b0, #ba68c8, #e1bee7); }
.links-content .editorial-links a:nth-child(2) { background: linear-gradient(90deg, #607d8b, #90a4ae, #cfd8dc); }

.links-content .government-links a:nth-child(1) { background: linear-gradient(90deg, #f0f8ff, #00bcd4, #03a9f4); }

.links-content .astrology-links a:nth-child(1) { background: linear-gradient(90deg, #4caf50, #8bc34a, #cddc39); }
.links-content .astrology-links a:nth-child(2) { background: linear-gradient(90deg, #f44336, #e53935, #d32f2f); }
.links-content .astrology-links a:nth-child(3) { background: linear-gradient(90deg, #00bcd4, #03a9f4, #009688); }

.links-content .vaidik-links a:nth-child(1) { background: linear-gradient(90deg, #ffeb3b, #ffc107, #ff9800); }
.links-content .vaidik-links a:nth-child(2) { background: linear-gradient(90deg, #ffffcc, #f0e68c, #d7ccc8); }
