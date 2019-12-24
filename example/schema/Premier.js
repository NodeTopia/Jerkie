const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let PremierSchema = new Schema({
    title : String,
    format : String,
    releaseYear : Number,
    releaseMonth : Number,
    releaseDay : Number,
});
let autoPopulateLead = function(next) {

    next();
};

PremierSchema.pre('findOne', autoPopulateLead);
PremierSchema.pre('find', autoPopulateLead);

module.exports = mongoose.model('Premier', PremierSchema);