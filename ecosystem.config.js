module.exports={
    apps:[{
        name:'Backend',
        script:'app.js',
        args:'--host 0.0.0.0',
        instances:1,
        autorestart:true,
        watch:false,
        max_memory_restart:'500M',
        env:{
            NODE_ENV:'production'
        }
    }]
}