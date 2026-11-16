import {
  BoxGeometry, CanvasTexture, CylinderGeometry, Group, Mesh,
  MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace,
} from 'three';

function createTileTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#c8c1b0';
    ctx.fillRect(0, 0, 256, 256);
    const tiles = [
      { x: 3, y: 3, w: 122, h: 122, color: '#dfd9ca' },
      { x: 131, y: 3, w: 122, h: 122, color: '#dad4c4' },
      { x: 3, y: 131, w: 122, h: 122, color: '#dcd5c6' },
      { x: 131, y: 131, w: 122, h: 122, color: '#e2dccd' },
    ];
    for (const tile of tiles) {
      ctx.fillStyle = tile.color;
      ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(7, 7);
  return texture;
}

export function createPatio(): Group {
  const root = new Group();

  const floorMaterial = new MeshStandardMaterial({
    map: createTileTexture(),
    roughness: 0.96,
  });
  const floor = new Mesh(new PlaneGeometry(20, 20), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(2, -2.2, 2);
  floor.receiveShadow = true;
  root.add(floor);

  const wallMaterial = new MeshStandardMaterial({ color: '#ebe5d6', roughness: 0.94 });
  const trimMaterial = new MeshStandardMaterial({ color: '#ccc4b4', roughness: 0.92 });

  const backWall = new Mesh(new BoxGeometry(15.4, 5.4, 0.4), wallMaterial);
  backWall.position.set(3.5, 0.5, -4.0);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  root.add(backWall);

  const sideWall = new Mesh(new BoxGeometry(0.4, 5.4, 15.4), wallMaterial);
  sideWall.position.set(-4.0, 0.5, 3.5);
  sideWall.castShadow = true;
  sideWall.receiveShadow = true;
  root.add(sideWall);

  const backPlinth = new Mesh(new BoxGeometry(15.2, 0.36, 0.48), trimMaterial);
  backPlinth.position.set(3.5, -2.02, -3.98);
  backPlinth.receiveShadow = true;
  root.add(backPlinth);

  const sidePlinth = new Mesh(new BoxGeometry(0.48, 0.36, 15.2), trimMaterial);
  sidePlinth.position.set(-3.98, -2.02, 3.5);
  sidePlinth.receiveShadow = true;
  root.add(sidePlinth);

  const backCoping = new Mesh(new BoxGeometry(15.5, 0.2, 0.56), trimMaterial);
  backCoping.position.set(3.5, 3.28, -4.0);
  backCoping.castShadow = true;
  root.add(backCoping);

  const sideCoping = new Mesh(new BoxGeometry(0.56, 0.2, 15.5), trimMaterial);
  sideCoping.position.set(-4.0, 3.28, 3.5);
  sideCoping.castShadow = true;
  root.add(sideCoping);

  const potMaterial = new MeshStandardMaterial({ color: '#b86846', roughness: 0.88 });
  const rimMaterial = new MeshStandardMaterial({ color: '#c2714e', roughness: 0.85 });
  const soilMaterial = new MeshStandardMaterial({ color: '#4a3b2c', roughness: 1 });

  const potBody = new Mesh(new CylinderGeometry(1.12, 0.78, 1.6, 36), potMaterial);
  potBody.position.set(0, -1.4, 0);
  potBody.castShadow = true;
  potBody.receiveShadow = true;
  root.add(potBody);

  const potRim = new Mesh(new CylinderGeometry(1.2, 1.15, 0.24, 36), rimMaterial);
  potRim.position.set(0, -0.68, 0);
  potRim.castShadow = true;
  potRim.receiveShadow = true;
  root.add(potRim);

  const soil = new Mesh(new CylinderGeometry(1.06, 1.06, 0.08, 32), soilMaterial);
  soil.position.set(0, -0.62, 0);
  soil.receiveShadow = true;
  root.add(soil);

  return root;
}
