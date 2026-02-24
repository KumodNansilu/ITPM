const StudyMaterial = require('../models/StudyMaterial');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const fs = require('fs');
const path = require('path');

// Upload Study Material
exports.uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { subject, topic, title, description } = req.body;

    const materialData = {
      title,
      description,
      subject,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype.split('/')[1],
      fileSize: req.file.size,
      uploadedBy: req.user.id
    };

    // only include topic if provided
    if (topic) materialData.topic = topic;

    const material = new StudyMaterial(materialData);

    await material.save();

    // Add material to topic if topic provided
    if (topic) {
      await Topic.findByIdAndUpdate(
        topic,
        { $push: { materials: material._id } },
        { new: true }
      );
    }

    res.status(201).json({
      message: 'Material uploaded successfully',
      material
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, '../uploads/', req.file.filename));
    }
    res.status(500).json({ message: error.message });
  }
};

// Get materials by subject
exports.getMaterialsBySubject = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ subject: req.params.subjectId })
      .populate('uploadedBy', 'name email');
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get materials by topic
exports.getMaterialsByTopic = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ topic: req.params.topicId })
      .populate('uploadedBy', 'name email');
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all materials
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ isPublished: true })
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('uploadedBy', 'name email');
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    )
    .populate('uploadedBy', 'name email')
    .populate('subject', 'name')
    .populate('topic', 'name');

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Material
exports.updateMaterial = async (req, res) => {
  try {
    const { title, description, isPublished } = req.body;

    const material = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        isPublished,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.status(200).json({
      message: 'Material updated successfully',
      material
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Material
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Delete file from server
    const filePath = path.join(__dirname, '../' + material.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await StudyMaterial.findByIdAndDelete(req.params.id);

    // Remove material from topic if set
    if (material.topic) {
      await Topic.findByIdAndUpdate(
        material.topic,
        { $pull: { materials: req.params.id } }
      );
    }

    res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download Material (increment download count)
exports.downloadMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const filePath = path.join(__dirname, '../' + material.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, material.fileName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
