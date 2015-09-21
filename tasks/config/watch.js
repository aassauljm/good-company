module.exports = function(grunt) {

	grunt.config.set('watch', {
		/*api: {

			// API files to watch:
			//files: ['api/**', '!**node_modules']
		},*/
		assets: {

			// Assets to watch:
			files: ['assets/*', 'assets/fonts/*', 'assets/images/*',  'tasks/pipeline.js'],

			// When assets are changed:
			tasks: ['syncAssets' , 'linkAssets']
		}
	});
	grunt.loadNpmTasks('grunt-contrib-watch');
};
