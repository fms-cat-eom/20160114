( function() {

	'use strict';

	// ------

  let particleCountSqrt = 256;
  let particleCount = particleCountSqrt * particleCountSqrt;
	let blurStep = 10;
	let randomWidth = 1024;
	let randomHeight = 1024;
	let noiseWidth = 512;
	let noiseHeight = 512;

	// ------

  let canvas = document.getElementById( 'canvas' );
	let gl = canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' );
	let glCat = new GLCat( gl );
	gl.disable( gl.DEPTH_TEST );

	// ------

	let vbo = {};
	let framebuffer = {};
	let texture = {};
	let shader = {};
  let program = {};

	// ------

	let frame = 0;

  // ------

	var prepare = function() {

	  vbo.quad = glCat.createVertexbuffer( [ -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1 ] );
		vbo.particle = glCat.createVertexbuffer( ( function() {
			let a = [];
			for ( let iy = 0; iy < particleCountSqrt; iy ++ ) {
				for ( let ix = 0; ix < particleCountSqrt; ix ++ ) {
					a.push( ix );
					a.push( iy );
				}
			}
			return a;
		} )() );

	  // ------

		framebuffer.noise = glCat.createFloatFramebuffer( noiseWidth, noiseHeight );
	  framebuffer.gpgpu = glCat.createFloatFramebuffer( particleCountSqrt * 4, particleCountSqrt );
	  framebuffer.gpgpuReturn = glCat.createFloatFramebuffer( particleCountSqrt * 4, particleCountSqrt );
		framebuffer.render = glCat.createFloatFramebuffer( canvas.width, canvas.height );
		framebuffer.post = glCat.createFloatFramebuffer( canvas.width, canvas.height );
		framebuffer.blur = glCat.createFloatFramebuffer( canvas.width, canvas.height );
	  framebuffer.blurReturn = glCat.createFloatFramebuffer( canvas.width, canvas.height );

	  // ------

	  texture.random = glCat.createTexture();
		glCat.setTextureFromFloatArray( texture.random, randomWidth, randomHeight, ( function() {
			let a = [];
			for ( let i = 0; i < randomWidth * randomHeight * 4; i ++ ) {
				a.push( Math.random() );
			}
			return a;
		} )() );

	};

  // ------

  let update = function() {

		for ( let iBlur = 0; iBlur < blurStep; iBlur ++ ) {
	    let time = ( frame / 100.0 / blurStep ) % 1.0;

			{ // noise field
				glCat.useProgram( program.noise );
				gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.noise );
				gl.viewport( 0, 0, noiseWidth, noiseHeight );

				glCat.clear();
				gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

				glCat.attribute( 'position', vbo.quad, 2 );

				glCat.uniform1f( 'time', time );
				glCat.uniform2fv( 'resolution', [ noiseWidth, noiseHeight ] );

				gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
			}

			{ // particle calculation
				glCat.useProgram( program.gpgpu );
				gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.gpgpu );
				gl.viewport( 0, 0, particleCountSqrt * 4, particleCountSqrt );

				glCat.clear();
				gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

				glCat.attribute( 'position', vbo.quad, 2 );

				glCat.uniform1i( 'init', frame === 0.0 );
				glCat.uniform1f( 'time', time );
				glCat.uniform1f( 'blurStep', blurStep );
				glCat.uniform1f( 'particleCountSqrt', particleCountSqrt );
				glCat.uniform2fv( 'randomReso', [ randomWidth, randomHeight ] );

				glCat.uniformTexture( 'randomTexture', texture.random, 0 );
				glCat.uniformTexture( 'noiseTexture', framebuffer.noise.texture, 1 );
				glCat.uniformTexture( 'particleTexture', framebuffer.gpgpuReturn.texture, 2 );

				gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
			}

			{ // particle calculation return
				glCat.useProgram( program.return );
				gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.gpgpuReturn );
				gl.viewport( 0, 0, particleCountSqrt * 4, particleCountSqrt );

				glCat.clear();
				gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

				glCat.attribute( 'position', vbo.quad, 2 );

				glCat.uniform2fv( 'resolution', [ particleCountSqrt * 4, particleCountSqrt ] );

				glCat.uniformTexture( 'texture', framebuffer.gpgpu.texture, 0 );

				gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
			}

			{ // particle rendering
	      glCat.useProgram( program.render );
	      gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.render );
	      gl.viewport( 0, 0, canvas.width, canvas.height );

	      glCat.clear();
	      gl.blendFunc( gl.SRC_ALPHA, gl.ONE );

	      glCat.attribute( 'uv', vbo.particle, 2 );

	      glCat.uniform1f( 'time', time );
	      glCat.uniform1f( 'particleCountSqrt', particleCountSqrt );
	      glCat.uniform2fv( 'resolution', [ canvas.width, canvas.height ] );

	      glCat.uniformTexture( 'particleTexture', framebuffer.gpgpu.texture, 0 );
	      glCat.uniformTexture( 'noiseTexture', framebuffer.noise.texture, 1 );

	      gl.drawArrays( gl.POINTS, 0, vbo.particle.length / 2 );
	    }

			{ // noise rendering
	      glCat.useProgram( program.noiseRender );
	      gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.render );
	      gl.viewport( 0, 0, canvas.width, canvas.height );

	      gl.blendFunc( gl.SRC_ALPHA, gl.ONE );

	      glCat.attribute( 'position', vbo.quad, 2 );

	      glCat.uniform2fv( 'resolution', [ canvas.width, canvas.height ] );

	      glCat.uniformTexture( 'noiseTexture', framebuffer.noise.texture, 0 );

	      gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
	    }

			{ // blur
	      glCat.useProgram( program.blur );
	      gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.blur );
	      gl.viewport( 0, 0, canvas.width, canvas.height );

	    	glCat.clear();
	      gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

	      glCat.attribute( 'position', vbo.quad, 2 );

				glCat.uniform1i( 'init', iBlur === 0 );
				glCat.uniform1f( 'add', 1.0 / blurStep );
				glCat.uniform1f( 'blurStep', blurStep );
	      glCat.uniform2fv( 'resolution', [ canvas.width, canvas.height ] );

	      glCat.uniformTexture( 'postTexture', framebuffer.render.texture, 0 );
				glCat.uniformTexture( 'blurTexture', framebuffer.blurReturn.texture, 1 );

	      gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
	    }

			{ // blur return
	      glCat.useProgram( program.return );
				gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.blurReturn );
	      gl.viewport( 0, 0, canvas.width, canvas.height );

	    	glCat.clear();
	      gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

	      glCat.attribute( 'position', vbo.quad, 2 );

	      glCat.uniform2fv( 'resolution', [ canvas.width, canvas.height ] );

				glCat.uniformTexture( 'texture', framebuffer.blur.texture, 0 );

	      gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
	    }

			frame ++;
		}

		{ // draw
			glCat.useProgram( program.final );
			gl.bindFramebuffer( gl.FRAMEBUFFER, null );
			gl.viewport( 0, 0, canvas.width, canvas.height );

			glCat.clear();
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

			glCat.attribute( 'position', vbo.quad, 2 );

			glCat.uniform2fv( 'resolution', [ canvas.width, canvas.height ] );

			glCat.uniformTexture( 'texture', framebuffer.blur.texture, 0 );

			gl.drawArrays( gl.TRIANGLES, 0, vbo.quad.length / 2 );
		}

    if ( 200 * blurStep <= frame ) {
      // var url = canvas.toDataURL();
      // var a = document.createElement( 'a' );
      // a.download = ( '000' + frame ).slice( -4 ) + '.png';
      // a.href = url;
      // a.click();
    }

    requestAnimationFrame( update );

  };

  // ------

  let ready = false;

	document.getElementById( 'button' ).addEventListener( 'click', function() {
    if ( ready && frame === 0 ) {
			prepare();
      update();
    }
  } );

	document.getElementById( 'button2' ).addEventListener( 'click', function() {
    if ( ready && frame === 0 ) {
			blurStep = 1;
			prepare();
      update();
    }
  } );

  step( {

    0: function( _step ) {

			[
				'plane.vert',
				'return.frag',
				'noise.frag',
				'gpgpu.frag',
				'render.vert',
				'render.frag',
				'noiserender.frag',
				'blur.frag',
				'final.frag'
			].map( function( _name ) {
				requestText( './shader/' + _name, function( _text ) {
					shader[ _name ] = _text;
					_step();
				} );
			} );

		},

    9: function( _step ) {

			program.noise = glCat.createProgram( shader[ 'plane.vert' ], shader[ 'noise.frag' ] );
      program.gpgpu = glCat.createProgram( shader[ 'plane.vert' ], shader[ 'gpgpu.frag' ] );
			program.render = glCat.createProgram( shader[ 'render.vert' ], shader[ 'render.frag' ] );
			program.noiseRender = glCat.createProgram( shader[ 'plane.vert' ], shader[ 'noiserender.frag' ] );
      program.return = glCat.createProgram( shader[ 'plane.vert' ], shader[ 'return.frag' ] );
			program.blur = glCat.createProgram( shader[ 'plane.vert' ], shader[ 'blur.frag' ] );
      program.final = glCat.createProgram( shader[ 'plane.vert' ], shader[ 'final.frag' ] );

      ready = true;

    }

  } );

} )();
