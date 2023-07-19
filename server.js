


const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
var bodyParser = require('body-parser');
// const { error } = require('console');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
// Thiết lập multer để lưu trữ ảnh được tải lên trong thư mục 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'uploads/');
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname);
    // const filename = `${Date.now()}-${Math.floor(Math.random() * 10000)}${extension}`;
    const filename = file.originalname;
    callback(null, filename);
  }
});

const upload = multer({ storage: storage });

// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'))

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'))
})


// Xử lý yêu cầu POST đến đường dẫn '/upload' và lưu trữ ảnh tải lên
app.post('/', upload.array('images'), (req, res) => {
  // Lấy danh sách các tệp ảnh đã tải lên từ req.files
  const images = req.files.map(file => file.filename);
  console.log(images);

  
  // Chuyển đổi ảnh thành định dạng WebP và gửi lại cho client
  Promise.all(
    images.map(image => {
      const webpPath = `uploads/webp/${image.split(".",1)[0]}.webp`;
      return sharp(`uploads/${image}`)
        .webp()
        .toFile(webpPath)
        .then(() => webpPath);
    })
  )
    .then(webpPaths => {
        res.on('finish', () => {
            // Xóa các file ảnh trên server sau khi phản hồi đã hoàn tất
            images.forEach(image => {
                const imagePath = `uploads/${image}`;
                try {
                  fs.unlinkSync(imagePath);
                  console.log(`Deleted file: ${imagePath}`);
                } catch (error) {
                  console.error('Error deleting image:', error);
                }
              });
          });
        res.json({ webpPaths });
    })
    .catch(error => {
      console.error('Image conversion error:', error);
      res.status(500).send('Image conversion error');
    });

  // Ở đây, chúng ta chỉ trả về danh sách tên tệp ảnh đã tải lên
//   res.json({ message: `Uploaded images: ${images.join(', ')}` });
});

app.post('/delete', (req, res) => {
  const listFile=req.body
  console.log();
  setTimeout(() => {
    listFile.forEach(el=>{
      try {
        fs.unlinkSync(el);
        console.log(`Deleted file: ${el}`);
        res.json({ ok: `Deleted ${listFile.length} file` });
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    })
  }, 1000*60*5); // 5 phuts
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
