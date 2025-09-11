const axios = require('axios');

async function directAPITest() {
    console.log('🧪 Direct API Testing...\n');
    
    const BASE_URL = 'http://localhost/api';
    
    try {
        // 测试1: 直接测试 getIngredientOptions API
        console.log('1. 🥕 Testing getIngredientOptions API directly...');
        console.log(`   URL: ${BASE_URL}/shopping-list/ingredient-options?name=Milk`);
        
        try {
            const response = await axios.get(`${BASE_URL}/shopping-list/ingredient-options?name=Milk`);
            console.log('   ✅ API call successful!');
            console.log('   📊 Status:', response.status);
            console.log('   📋 Response:', response.data);
        } catch (error) {
            console.log('   ❌ API call failed!');
            if (error.response) {
                console.log('   📊 Status:', error.response.status);
                console.log('   📋 Response:', error.response.data);
                console.log('   🔍 Headers:', error.response.headers);
            } else if (error.request) {
                console.log('   ❌ No response received:', error.message);
            } else {
                console.log('   ❌ Request setup error:', error.message);
            }
        }
        console.log();
        
        // 测试2: 测试服务器是否运行
        console.log('2. 🌐 Testing server connectivity...');
        try {
            const response = await axios.get(`${BASE_URL}/shopping-list?user_id=225`);
            console.log('   ✅ Server is running and responding');
            console.log('   📊 Status:', response.status);
        } catch (error) {
            console.log('   ❌ Server connectivity issue:', error.message);
            if (error.code === 'ECONNREFUSED') {
                console.log('   💡 Server might not be running on localhost:3000');
            }
        }
        console.log();
        
        // 测试3: 检查API路由
        console.log('3. 🛣️ Testing API route structure...');
        console.log('   Available routes:');
        console.log('   - GET /api/shopping-list/ingredient-options?name=Milk');
        console.log('   - GET /api/shopping-list?user_id=225');
        console.log('   - POST /api/shopping-list');
        console.log('   - PATCH /api/shopping-list/items/:id');
        console.log('   - DELETE /api/shopping-list/items/:id');
        console.log();
        
        // 测试4: 检查环境变量
        console.log('4. 🔧 Environment check...');
        console.log('   BASE_URL:', BASE_URL);
        console.log('   Note: Make sure your server is running on the correct port');
        console.log();
        
    } catch (error) {
        console.error('💥 Error during direct API testing:', error.message);
    }
}

// 运行直接API测试如果直接执行此文件
if (require.main === module) {
    directAPITest()
        .then(() => {
            console.log('✅ Direct API testing completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Direct API testing failed:', error);
            process.exit(1);
        });
}

module.exports = { directAPITest };
