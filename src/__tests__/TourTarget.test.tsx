import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { TourTarget } from "../components/TourTarget";
import { TourGuideProvider } from "../TourGuideContext";

describe("TourTarget", () => {
  it("renders children inside the registered wrapper", () => {
    render(
      <TourGuideProvider>
        <TourTarget id="compose">
          <Text>Compose</Text>
        </TourTarget>
      </TourGuideProvider>,
    );

    expect(screen.getByText("Compose")).toBeTruthy();
  });
});
