/**
 * Created by CoderSong on 17/6/12.
 */

const mongoose = require('mongoose');

let scoreSchema = new mongoose.Schema({
  username: String,
  score: Number,
  meta: {
    createAt: {
      type: Date,
      default: Date.now()
    },
    updateAt: {
      type: Date,
      default: Date.now()
    }
  }
});

scoreSchema.pre('save', function (next) {
  if (this.isNew)
    this.meta.createAt = this.meta.updateAt = Date.now();

  else
    this.meta.updateAt = Date.now();

  next();
});

scoreSchema.statics = {
  checkIsExist: function (key, value, cb) {
    let obj = {};
    obj[key] = value;
    return this
      .findOne(obj)
      .exec(cb);
  },

  findTopTen: function (cb) {
    return this
      .find({})
      .limit(10)
      .sort({'score':-1})
      .exec(cb);
  }
};

module.exports = mongoose.model('Score', scoreSchema);