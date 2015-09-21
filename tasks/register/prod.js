module.exports = function (grunt) {
	grunt.registerTask('prod', [
		'clean:dev',
		'webpack:build',
		'copy:dev'
	]);
};
