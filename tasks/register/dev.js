module.exports = function (grunt) {
	grunt.registerTask('dev', [
		//'clean:dev',
		//'copy:dev',
        'webpack:build-dev',
	]);
};
