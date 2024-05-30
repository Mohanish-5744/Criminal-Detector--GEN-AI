const express = require('express');
const multer = require('multer');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Multer configuration for file upload
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
        }
    })
});

// Upload fields configuration for multiple files
const uploadFields = upload.fields([
    { name: 'base-image', maxCount: 1 },
    { name: 'test-image', maxCount: 1 }
]);

// Middleware configuration
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route for face detection
app.post('/check-face', uploadFields, async (req, res) => {
    const baseImagePath = req.files['base-image'][0].path;
    const testImagePath = req.files['test-image'][0].path;

    try {
        // Read image files as base64 data
        const baseImageData = fs.readFileSync(baseImagePath, { encoding: 'base64' });
        const testImageData = fs.readFileSync(testImagePath, { encoding: 'base64' });

        // Send request to face detection API
        const response = await axios.post('http://localhost:3000/api/ai/images/v2/face-detection', {
            baseImage: baseImageData,
            testImage: testImageData
        }, {
            headers: {
                'Authorization': 'Bearer YOUR_API_KEY', // Replace with your API key
                'Content-Type': 'application/json'
            }
        });

        // Process the response from the API
        const { detected_faces_count } = response.data;

        if (detected_faces_count > 0) {
            res.send("Faces detected");
        } else {
            res.send("No faces detected");
        }

    } catch (error) {
        console.error('Error detecting faces:', error.response ? error.response.data : error.message);
        res.status(500).send('Error detecting faces');
    } finally {
        // Delete uploaded image files
        fs.unlink(baseImagePath, (err) => {
            if (err) {
                console.error('Error deleting base image file:', err);
            }
        });
        fs.unlink(testImagePath, (err) => {
            if (err) {
                console.error('Error deleting test image file:', err);
            }
        });
    }
});

// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
