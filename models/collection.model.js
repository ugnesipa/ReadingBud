const { Schema, model } = require('mongoose');

const collectionSchema = new Schema({
  user: { // Owner of the collection
    type: Schema.Types.ObjectId, 
    ref: 'User', required:[true, 'user is required']
}, 
  name: { // Collection name, e.g., "Favorites", "To Read"
    type: String, 
    required: [true, 'name is required']
}, 
    description: { // Description of the collection
    type: String,
    }, 
    books: [{
    type: Schema.Types.ObjectId, 
    ref: 'Book' 
}], // Books in the collection

},
{
    timestamps: true, // Adds `createdAt` and `updatedAt` timestamps to the document
  } // Timestamp for when the collection was created
  );

module.exports = model('Collection', collectionSchema);