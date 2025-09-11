const supabase = require('../dbConnection.js');

async function preciseAPITest() {
    console.log('🎯 Precise API Testing - Exact Query Simulation...\n');
    
    try {
        // 模拟 getIngredientOptions API 的精确查询
        console.log('1. 🥕 Simulating getIngredientOptions API query exactly...');
        
        const name = 'Milk'; // 从 req.query.name 获取
        
        console.log(`   Search term: "${name}"`);
        console.log('   Executing exact query from controller...');
        
        try {
            // 这是控制器中的确切查询
            const { data, error } = await supabase
                .from('ingredient_price')
                .select(`
                    id,
                    ingredient_id,
                    name,
                    unit,
                    measurement,
                    price,
                    store_id,
                    ingredients!inner(name, category)
                `)
                .ilike('ingredients.name', `%${name}%`)
                .order('price', { ascending: true });

            if (error) {
                console.log('   ❌ Query failed with error:', error);
                console.log('   📊 Error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                
                // 尝试诊断问题
                if (error.code === 'PGRST200') {
                    console.log('   💡 This is a foreign key relationship error');
                    console.log('   🔍 Checking if ingredients table exists and has correct structure...');
                    
                    // 检查 ingredients 表
                    const { data: ingCheck, error: ingCheckError } = await supabase
                        .from('ingredients')
                        .select('id, name, category')
                        .limit(1);
                    
                    if (ingCheckError) {
                        console.log('   ❌ Ingredients table check failed:', ingCheckError.message);
                    } else {
                        console.log('   ✅ Ingredients table exists and accessible');
                        console.log('   📊 Sample ingredient:', ingCheck[0]);
                    }
                }
            } else {
                console.log('   ✅ Query successful!');
                console.log('   📊 Found data:', data.length, 'records');
                if (data.length > 0) {
                    console.log('   📋 Sample data structure:', JSON.stringify(data[0], null, 2));
                }
            }
        } catch (error) {
            console.log('   ❌ Query exception:', error.message);
            console.log('   🔍 Exception details:', error);
        }
        console.log();
        
        // 测试2: 检查数据库连接状态
        console.log('2. 🔌 Testing database connection...');
        try {
            const { data: testData, error: testError } = await supabase
                .from('ingredient_price')
                .select('id')
                .limit(1);
            
            if (testError) {
                console.log('   ❌ Database connection test failed:', testError.message);
            } else {
                console.log('   ✅ Database connection working');
                console.log('   📊 Connection test result:', testData.length, 'records');
            }
        } catch (error) {
            console.log('   ❌ Database connection exception:', error.message);
        }
        console.log();
        
        // 测试3: 检查表权限
        console.log('3. 🔐 Testing table permissions...');
        try {
            // 测试 SELECT 权限
            const { data: permData, error: permError } = await supabase
                .from('ingredient_price')
                .select('*')
                .limit(0);
            
            if (permError) {
                console.log('   ❌ SELECT permission test failed:', permError.message);
            } else {
                console.log('   ✅ SELECT permission working');
            }
        } catch (error) {
            console.log('   ❌ Permission test exception:', error.message);
        }
        
    } catch (error) {
        console.error('💥 Error during precise API testing:', error);
    }
}

// 运行精确API测试如果直接执行此文件
if (require.main === module) {
    preciseAPITest()
        .then(() => {
            console.log('\n✅ Precise API testing completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Precise API testing failed:', error);
            process.exit(1);
        });
}

module.exports = { preciseAPITest };
