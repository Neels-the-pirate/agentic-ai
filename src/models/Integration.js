const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
      index: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    accountIdentifier: {
      type: String, // email, workspace name, or channel name
      default: '',
    },
    scopes: {
      type: [String],
      default: [],
    },
    // AES-256 encrypted access & refresh tokens
    encryptedTokens: {
      iv: String,
      authTag: String,
      ciphertext: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    lastHealthCheck: {
      status: {
        type: String,
        enum: ['HEALTHY', 'EXPIRED', 'REVOKED', 'DISCONNECTED', 'UNKNOWN'],
        default: 'UNKNOWN',
      },
      checkedAt: Date,
      message: String,
    },
  },
  { timestamps: true }
);

// Ensure one provider connection per user
integrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Integration', integrationSchema);
