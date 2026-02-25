const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking MongoDB Connection...\n');
    console.log('Connecting to:', process.env.MONGODB_URI);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully\n');
    
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('📊 Database Collections:\n');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('⚠️  No collections found. Run seed script first:');
      console.log('   node scripts/seed.js\n');
      process.exit(0);
    }
    
    let totalDocuments = 0;
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      totalDocuments += count;
      console.log(`   ✓ ${col.name.padEnd(20)} ${count} documents`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📈 Total Collections: ${collections.length}`);
    console.log(`📈 Total Documents: ${totalDocuments}`);
    console.log('='.repeat(50));
    
    // Show sample user
    const User = db.collection('users');
    const sampleUser = await User.findOne({ role: 'admin' });
    
    if (sampleUser) {
      console.log('\n👤 Sample Admin User:');
      console.log(`   Email: ${sampleUser.email}`);
      console.log(`   Name: ${sampleUser.name}`);
      console.log(`   Role: ${sampleUser.role}`);
    }
    
    // Show sample program
    const Program = db.collection('programs');
    const sampleProgram = await Program.findOne();
    
    if (sampleProgram) {
      console.log('\n📚 Sample Program:');
      console.log(`   Code: ${sampleProgram.code}`);
      console.log(`   Name: ${sampleProgram.name}`);
      console.log(`   PLOs: ${sampleProgram.plos?.length || 0}`);
    }
    
    console.log('\n✅ Database is properly set up and populated!\n');
    
  } catch (error) {
    console.error('\n❌ Error connecting to MongoDB:');
    console.error('   Message:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solution:');
      console.log('   1. Make sure MongoDB is running');
      console.log('   2. Check if MongoDB service is started:');
      console.log('      Get-Service -Name MongoDB');
      console.log('   3. Start MongoDB:');
      console.log('      Start-Service -Name MongoDB');
    }
    
    console.log('');
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the check
checkDatabase();
