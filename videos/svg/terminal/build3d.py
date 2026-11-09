# monta terminal3d.html = biblioteca 3D (de board3d.html) + linha do tempo (_video.js)
h = open('board3d.html').read(); lib = h[:h.index('// ---------- planos ----------')]
a = "const geo = new THREE.CylinderGeometry(p.rb, p.ra, L, 24, 1, true);"; assert a in lib
lib = lib.replace(a, a + " (window.__geo || (window.__geo = [])).push(geo);")
open('terminal3d.html', 'w').write(lib + open('_video.js').read())
