const PARAMETERS_LOCAL_STORAGE_KEY = 'parameters';

type ParametersType = {
  torsoOffsetPercentage: number;
  torsoThickCount: number;
  torsoThickRadius: number;
  torsoMediumCount: number;
  torsoMediumRadius: number;
  torsoSmallCount: number;
  torsoSmallRadius: number;
  limbsOffsetPercentage: number;
  limbsThickCount: number;
  limbsThickRadius: number;
  limbsMediumCount: number;
  limbsMediumRadius: number;
  limbsSmallCount: number;
  limbsSmallRadius: number;
  cameraZ: number;
  cameraZoom: number;
  amountShapes: number;
  minPosesScore: number;
  videoDeviceId: string;
};
const PARAMETERS_DEFAULT_VALUES: ParametersType = {
  torsoOffsetPercentage: 3,
  torsoThickCount: 240,
  torsoThickRadius: 0.2,
  torsoMediumCount: 32,
  torsoMediumRadius: 0.1,
  torsoSmallCount: 60,
  torsoSmallRadius: 0.05,
  limbsOffsetPercentage: 1,
  limbsThickCount: 240,
  limbsThickRadius: 0.2,
  limbsMediumCount: 32,
  limbsMediumRadius: 0.1,
  limbsSmallCount: 60,
  limbsSmallRadius: 0.05,
  cameraZ: 6,
  cameraZoom: 100,
  amountShapes: 3,
  minPosesScore: 20,
  videoDeviceId: '',
};

const EMPTY_JSON = '{}';

export function initParameters() {
  const parameters = window.localStorage.getItem(PARAMETERS_LOCAL_STORAGE_KEY);
  const hasParameters = !!parameters;
  if (hasParameters) {
    return;
  }

  setDefaultParameters();
}

export function setDefaultParameters() {
  const defaultValues = JSON.stringify(PARAMETERS_DEFAULT_VALUES);
  window.localStorage.setItem(PARAMETERS_LOCAL_STORAGE_KEY, defaultValues);
}

export function getParameters(): ParametersType {
  const json = window.localStorage.getItem(PARAMETERS_LOCAL_STORAGE_KEY) ?? EMPTY_JSON;
  return JSON.parse(json);
}

export function setParameters(parameters: object) {
  const json = JSON.stringify(parameters);
  window.localStorage.setItem(PARAMETERS_LOCAL_STORAGE_KEY, json);
}
