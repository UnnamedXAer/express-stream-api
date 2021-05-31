import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';

chai.use(chaiHttp);

describe('Array', () => {
	describe('#indexOf()', () => {
		it('should return -1', () => {
			assert.strictEqual([1, 2, 3, 5].indexOf(4), -1);
		});
	});
});

describe('app', () => {
	describe('[GET] /available-media', () => {
		it('should return available videos', (done) => {
			chai.request(app)
				.get('/available-media')
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('array');
					done();
				});
		});
	});
});
// https://www.digitalocean.com/community/tutorials/test-a-node-restful-api-with-mocha-and-chai