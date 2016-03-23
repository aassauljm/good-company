module.exports = function (grunt) {
	grunt.registerTask('prod', [
		'clean:dev',
		'copy:dev',
        'webpack:build'
	]);
};
