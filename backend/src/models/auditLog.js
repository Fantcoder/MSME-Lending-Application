const { mongoose } = require('../db/mongo');

const auditLogSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    inputSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    decision: {
      type: String,
      enum: ['APPROVED', 'REJECTED'],
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reasonCodes: {
      type: [String],
      default: [],
    },
    processingMs: {
      type: Number,
      required: true,
    },
  },
  {
    collection: 'audit_logs',
    timestamps: false,
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
