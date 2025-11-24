import { Vector3 } from "three";
import { settings } from "../settings";
import { calculateOrbit } from "../utilities/astronomy";
import { convertToCamelCase } from "../utilities/strings";
import type { BodyData, Bodies, BodiesTypes } from "../../types";
import { materialData } from "./solarSystem";
import {
  addToMoonGroup,
  generalUpdates,
  isInnerPlanet,
  setOrbitCalculations,
  setRings,
  setWikipediaKeys,
  setSidebarImage,
  idReplacements,
} from "./sorting";

interface SortDataResult {
  sun: BodyData;
  moons: BodyData[];
  dwarfPlanets: BodyData[];
  planets: BodyData[];
}

const sortData = (
  data: BodyData[],
  bodies: Bodies,
  bodiesTypes: BodiesTypes
): SortDataResult => {
  const startingOrbitPosition = (objectData: BodyData): Vector3 => {
    const parentPlanetData = objectData.aroundPlanet
      ? data.find(
          (allData) => allData.id === objectData.aroundPlanet!.planet
        ) ?? null
      : null;
    const v = new Vector3();
    return v.copy(
      calculateOrbit(
        objectData.meanAnomaly, // TODO: this will be incorrect, but will do for now. Is not date-specific
        objectData,
        parentPlanetData
      )
    );
  };

  const englishifiedData = idReplacements(data);

  for (const item of englishifiedData) {
    item.media = {
      hasLoaded: false,
      noResults: false,
      hasError: false,
      errors: [],
      items: [],
      total: null,
      more: false,
      loadingMore: false,
      per_page: null,
      lightboxData: [],
    };

    item.description = {
      hasLoaded: false,
      noResults: false,
      hasError: false,
      errors: [],
      title: "",
      content: "",
      image: "",
    };

    item.materialData = materialData[item.id] || null;

    // Math.min to account for huge bodies like Sun
    item.zoomTo = Math.min(item.meanRadius * 8, item.meanRadius + 7000000);

    item.labelColour =
      settings.planetColours[item.id] ||
      settings.planetColours[item.bodyType] ||
      settings.planetColours.default;

    // setting the 'entity types' here rather than further down and redoing the loop
    const typeKey = "_" + convertToCamelCase(item.bodyType);
    const typedKey = typeKey as keyof BodiesTypes;
    bodiesTypes[typedKey] = bodiesTypes[typedKey] || [];
    (bodiesTypes[typedKey] as BodyData[]).push(item);

    generalUpdates(item, englishifiedData);
    addToMoonGroup(item);
    isInnerPlanet(item);
    setRings(item);
    setOrbitCalculations(item);
    setWikipediaKeys(item);
    setSidebarImage(item);
  }

  bodies._all = [...englishifiedData];
  const sun = bodiesTypes._star[0];

  const moons = bodiesTypes._moon;
  for (const moon of moons) {
    moon.materialData = materialData[moon.id] || null;
    moon.startingPosition = new Vector3();
    moon.startingPosition.copy(startingOrbitPosition(moon));
  }

  // assigning proper moon data to each entity, rather than just the ID that the API provides
  const setMoonsToDataEntity = (entity: BodyData) => {
    if (entity.moons && Array.isArray(entity.moons) && entity.moons.length) {
      const eMoons = entity.moons
        .map((eMoon) => {
          if (typeof eMoon === "object" && "moon" in eMoon) {
            return moons.find((m) => m.id === eMoon.moon);
          }
          return eMoon as BodyData;
        })
        .filter((m): m is BodyData => m !== undefined)
        // sorting by moonGroupIndex, then by distance from planet
        .sort((a, b) => {
          const aIndex = a.moonGroupIndex ?? 0;
          const bIndex = b.moonGroupIndex ?? 0;
          if (aIndex > bIndex) return 1;
          if (aIndex < bIndex) return -1;
          if (a.semimajorAxis > b.semimajorAxis) return 1;
          if (a.semimajorAxis < b.semimajorAxis) return -1;
          return 0;
        });
      entity.moons = eMoons;
    }
  };

  const dwarfPlanets = bodiesTypes._dwarfPlanet;
  for (const dwarfPlanet of dwarfPlanets) {
    dwarfPlanet.startingPosition = new Vector3();
    dwarfPlanet.startingPosition.copy(startingOrbitPosition(dwarfPlanet));

    setMoonsToDataEntity(dwarfPlanet);
  }

  const planets = bodiesTypes._planet;
  for (const planet of planets) {
    planet.startingPosition = new Vector3();
    planet.startingPosition.copy(startingOrbitPosition(planet));
    planet.bodyType = "Planet";

    setMoonsToDataEntity(planet);
  }

  // Building 'Entity Nav' ids with:
  // Planets > Planet Moons > Dwarf Planets > Dwarf Planet Moons > Asteroids
  for (const navSystemName of settings.navigationSystems) {
    const entityItem = bodies._all.find(
      (allItem) => allItem.id === navSystemName
    );
    if (entityItem) {
      settings.navigationEntities.push(entityItem.id);
      if (
        entityItem.moons &&
        Array.isArray(entityItem.moons) &&
        entityItem.moons.length
      ) {
        for (const moon of entityItem.moons) {
          if (typeof moon === "object" && "id" in moon) {
            settings.navigationEntities.push(moon.id);
          }
        }
      }
    }
  }

  return {
    sun,
    moons,
    dwarfPlanets,
    planets,
  };
};

interface APIResponse<T = any> {
  errors: Array<{ code?: string; message: string }>;
  result: T;
}

class APIRequest {
  private AbortController: AbortController;
  private requestTimeout: number;

  constructor() {
    this.AbortController = new AbortController();
    this.requestTimeout = 15000;
  }

  apiResponse<T = any>({
    errors = [],
    result = [] as any,
  }: {
    errors?: Array<{ code?: string; message: string }>;
    result?: T;
  } = {}): APIResponse<T> {
    return { errors, result };
  }

  handleErrors(response: Response): Response {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }

  async GET<T = any>(url: string): Promise<APIResponse<T>> {
    const timeoutId = setTimeout(() => {
      this.AbortController.abort();
    }, this.requestTimeout);
    return await fetch(url, { signal: this.AbortController.signal })
      .then(this.handleErrors)
      .then((response) => response.json())
      .then((rJSON: T) => {
        clearTimeout(timeoutId);
        return this.apiResponse({ result: rJSON });
      })
      .catch((e: Error) => {
        console.error(e);
        return this.apiResponse({
          errors: [{ code: "timeout", message: "The response timed out." }],
        });
      });
  }
}

export { sortData, APIRequest };
export type { SortDataResult, APIResponse };
