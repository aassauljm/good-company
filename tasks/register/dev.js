module.exports = function (grunt) {
	grunt.registerTask('dev', [
		'clean:dev',
		'webpack:build-dev',
		'copy:dev',
	]);
};
