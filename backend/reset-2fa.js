const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisApp';

// Ensure the MongoDB URI includes the database name
const getMongoURI = () => {
  let uri = MONGODB_URI;
  // If it's a MongoDB Atlas URI and doesn't have a database name, add 'tennisApp'
  if (uri.includes('mongodb+srv://') && !uri.includes('mongodb.net/tennisApp')) {
    uri = uri.replace('mongodb.net/', 'mongodb.net/tennisApp');
  }
  return uri;
};

async function reset2FA() {
  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(getMongoURI(), {
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
      ssl: true,
      tlsAllowInvalidCertificates: false
    });
    
    await client.connect();
    const db = client.db();
    
    // Get the email from command line arguments
    const email = process.argv[2];
    if (!email) {
      console.log('Usage: node reset-2fa.js <email>');
      process.exit(1);
    }
    
    console.log(`Resetting 2FA for user: ${email}`);
    
    // Find and update the user
    const result = await db.collection('users').updateOne(
      { email: email },
      { 
        $set: { twoFactorEnabled: false },
        $unset: { 
          twoFactorSecret: "",
          twoFactorBackupCodes: ""
        }
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('User not found!');
    } else if (result.modifiedCount > 0) {
      console.log('2FA reset successfully! You can now log in with just email and password.');
    } else {
      console.log('User found but no changes were needed.');
    }
    
  } catch (error) {
    console.error('Error resetting 2FA:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

reset2FA(); 