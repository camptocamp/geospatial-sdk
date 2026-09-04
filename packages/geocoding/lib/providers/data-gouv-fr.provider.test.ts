import { GeocodingResult } from "../model/index.js";
import { queryDataGouvFr } from "./data-gouv-fr.provider.js";
import { queryGeoplateforme } from "./geoplateforme.provider.js";

vi.mock("./geoplateforme.provider.js", () => ({
  queryGeoplateforme: vi.fn(),
}));

const RESULTS_FIXTURE: GeocodingResult[] = [
  {
    label: "8 Boulevard du Port 80000 Amiens",
    properties: { citycode: "80021" },
    geom: { type: "Point", coordinates: [2.290084, 49.897443] },
  },
];

describe("queryDataGouvFr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queryGeoplateforme).mockResolvedValue(RESULTS_FIXTURE);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("delegates to queryGeoplateforme, querying the address index", async () => {
    const results = await queryDataGouvFr("hello");
    expect(queryGeoplateforme).toHaveBeenCalledWith("hello", {
      index: ["address"],
      type: undefined,
      postCode: undefined,
      cityCode: undefined,
      limit: undefined,
    });
    expect(results).toBe(RESULTS_FIXTURE);
  });

  it("wraps single-value options into arrays", async () => {
    await queryDataGouvFr("hello world", {
      type: "street",
      limit: 32,
      cityCode: "12345",
      postCode: "00000",
    });
    expect(queryGeoplateforme).toHaveBeenCalledWith("hello world", {
      index: ["address"],
      type: ["street"],
      postCode: ["00000"],
      cityCode: ["12345"],
      limit: 32,
    });
  });

  it("logs a deprecation warning", async () => {
    await queryDataGouvFr("hello");
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("deprecated"),
    );
  });
});
