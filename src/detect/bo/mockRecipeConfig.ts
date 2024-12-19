const mockRecipeConfig = {
  designValue: {
    maxRow: 715,
    maxCol: 715,
    chipNum: 1,
  },
  motorZ: 70,
  detectExposureTime: 15_000,
  locationL: {
    motorCoor: [50, 50],
  },
  locationR: {
    motorCoor: [100, 100],
  },
  mapParams: [
    -23.814633352512605, 0, 2324.8582496584995, 0, 23.804746876961232,
    -930.7080318438426, 0, 0, 1,
  ],
  rectifyParams: [
    1.000001001877541, 0, -0.0004724222292509239, 0, 1.0000010019284673,
    0.0006768340244889259, 0, 0, 1,
  ],
  chipList: [
    0.16670243346758823, 0.14292144593974596, 0.7620682672804033,
    0.8570638522485828,
  ],
  patterns: [
    {
      id: 1,
      name: '同轴',
      lightType: 'COAXIAL',
      enableAnomaly: true,
      enableMeasure: true,
      modelFile: '20241016_test1.huanguang.db',
      anomaly: 0.7,
      ignores: [0],
    },
    // {
    //   id: 2,
    //   name: '环光',
    //   lightType: 'RING',
    //   enableAnomaly: true,
    //   enableMeasure: false,
    // },
  ],
  roiDotList: [
    20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30,
    30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20,
    30, 30, 20, 20, 30, 30,
  ],
  chipMeasureX: [-1.5, 1.5],
  chipMeasureY: [-1.5, 1.5],
  chipMeasureR: [-1.5, 1.5],
  roiCornerMotor: [
    97.62309649051184, 39.097581530875374, 67.59953956054554, 69.13360770067247,
    -0.0031858581209718295, 0.006539127039388859,
  ],
  measureChipModelFile: 'chip1.ncc',
  measurePadModelFile: 'pad1.ncc',
  mapImgPath: 'map.png',
};

export default mockRecipeConfig;
