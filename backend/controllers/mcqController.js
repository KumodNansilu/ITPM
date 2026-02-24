const MCQ = require('../models/MCQ');
const MCQAttempt = require('../models/MCQAttempt');

// Create MCQ Question (Tutor Only)
exports.createMCQ = async (req, res) => {
  try {
    const { question, subject, topic, options, explanation, difficulty } = req.body;

    // Validate that at least one option is correct
    const hasCorrectOption = options.some(opt => opt.isCorrect);
    if (!hasCorrectOption) {
      return res.status(400).json({ message: 'At least one option must be marked as correct' });
    }

    const mcq = new MCQ({
      question,
      subject,
      topic,
      options,
      explanation,
      difficulty,
      createdBy: req.user.id
    });

    await mcq.save();

    res.status(201).json({
      message: 'MCQ created successfully',
      mcq
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all MCQs by subject
exports.getMCQsBySubject = async (req, res) => {
  try {
    const mcqs = await MCQ.find({ subject: req.params.subjectId })
      .populate('createdBy', 'name email')
      .populate('topic', 'name');

    res.status(200).json(mcqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all MCQs by topic
exports.getMCQsByTopic = async (req, res) => {
  try {
    const mcqs = await MCQ.find({ topic: req.params.topicId })
      .populate('createdBy', 'name email')
      .populate('subject', 'name');

    res.status(200).json(mcqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get MCQ by ID (without showing correct answers)
exports.getMCQById = async (req, res) => {
  try {
    const mcq = await MCQ.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('subject', 'name')
      .populate('topic', 'name');

    if (!mcq) {
      return res.status(404).json({ message: 'MCQ not found' });
    }

    // Hide correct answer when fetching for students
    const mcqData = mcq.toObject();
    const hideAnswers = req.query.hideAnswers !== 'false';
    
    if (hideAnswers) {
      mcqData.options = mcqData.options.map(opt => ({
        text: opt.text,
        _id: opt._id
      }));
      mcqData.explanation = null;
    }

    res.status(200).json(mcqData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update MCQ
exports.updateMCQ = async (req, res) => {
  try {
    const { question, options, explanation, difficulty } = req.body;

    const mcq = await MCQ.findByIdAndUpdate(
      req.params.id,
      {
        question,
        options,
        explanation,
        difficulty,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!mcq) {
      return res.status(404).json({ message: 'MCQ not found' });
    }

    res.status(200).json({
      message: 'MCQ updated successfully',
      mcq
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete MCQ
exports.deleteMCQ = async (req, res) => {
  try {
    const mcq = await MCQ.findByIdAndDelete(req.params.id);

    if (!mcq) {
      return res.status(404).json({ message: 'MCQ not found' });
    }

    // Delete all attempts
    await MCQAttempt.deleteMany({ mcq: req.params.id });

    res.status(200).json({ message: 'MCQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit MCQ Answer
exports.submitMCQAnswer = async (req, res) => {
  try {
    const { selectedOption } = req.body;
    const { mcqId } = req.params;

    const mcq = await MCQ.findById(mcqId);
    if (!mcq) {
      return res.status(404).json({ message: 'MCQ not found' });
    }

    const isCorrect = mcq.options[selectedOption]?.isCorrect || false;

    const attempt = new MCQAttempt({
      student: req.user.id,
      mcq: mcqId,
      selectedOption,
      isCorrect
    });

    await attempt.save();

    // Return result without revealing answer
    res.status(201).json({
      message: 'Answer submitted',
      attempt: {
        _id: attempt._id,
        isCorrect: attempt.isCorrect,
        selectedOption: attempt.selectedOption
      },
      feedback: {
        isCorrect,
        explanation: mcq.explanation,
        correctOption: mcq.options.findIndex(opt => opt.isCorrect)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's MCQ attempts
exports.getUserMCQAttempts = async (req, res) => {
  try {
    const { subject, topic } = req.query;
    let filter = { student: req.user.id };

    if (subject) {
      const mcqs = await MCQ.find({ subject });
      const mcqIds = mcqs.map(m => m._id);
      filter.mcq = { $in: mcqIds };
    }

    const attempts = await MCQAttempt.find(filter)
      .populate({
        path: 'mcq',
        populate: [
          { path: 'subject', select: 'name' },
          { path: 'topic', select: 'name' }
        ]
      })
      .sort({ attemptedAt: -1 });

    res.status(200).json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get quiz score
exports.getQuizScore = async (req, res) => {
  try {
    const { subjectId, topicId } = req.query;

    let filter = { student: req.user.id };

    if (subjectId || topicId) {
      const mcqFilter = {};
      if (subjectId) mcqFilter.subject = subjectId;
      if (topicId) mcqFilter.topic = topicId;

      const mcqs = await MCQ.find(mcqFilter);
      const mcqIds = mcqs.map(m => m._id);
      filter.mcq = { $in: mcqIds };
    }

    const attempts = await MCQAttempt.find(filter);

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.isCorrect).length;

    res.status(200).json({
      totalAttempts,
      correctAttempts,
      incorrectAttempts: totalAttempts - correctAttempts,
      scorePercentage: totalAttempts > 0 ? ((correctAttempts / totalAttempts) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
