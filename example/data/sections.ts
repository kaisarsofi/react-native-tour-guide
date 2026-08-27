import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ComponentType } from "react";

import { BackdropAndMotion } from "../demos/BackdropAndMotion";
import { BasicTargeting } from "../demos/BasicTargeting";
import { CrossScreenTour } from "../demos/CrossScreenTour";
import { CustomTooltip } from "../demos/CustomTooltip";
import { EventLog } from "../demos/EventLog";
import { HorizontalListControlsTour } from "../demos/HorizontalListControlsTour";
import { PaginatedCardsTour } from "../demos/PaginatedCardsTour";
import { Persistence } from "../demos/Persistence";
import { PassThroughTour } from "../demos/PassThroughTour";
import { PressableControlsTour } from "../demos/PressableControlsTour";
import { Themes } from "../demos/Themes";
import { VerticalListTour } from "../demos/VerticalListTour";
import { WizardNavigationTour } from "../demos/WizardNavigationTour";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type CategoryId = "targeting" | "behavior" | "scrolling";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: IconName;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "targeting", label: "Targeting", icon: "locate-outline" },
  { id: "behavior", label: "Behavior", icon: "options-outline" },
  { id: "scrolling", label: "Scrolling", icon: "swap-vertical-outline" },
];

export const CATEGORY_STYLES: Record<
  CategoryId,
  { badgeBg: string; iconColor: string; chipBg: string }
> = {
  targeting: { badgeBg: "bg-violet-50", iconColor: "#7C3AED", chipBg: "bg-violet-600" },
  behavior: { badgeBg: "bg-amber-50", iconColor: "#B45309", chipBg: "bg-amber-500" },
  scrolling: { badgeBg: "bg-emerald-50", iconColor: "#059669", chipBg: "bg-emerald-600" },
};

export interface SectionMeta {
  id: string;
  index: number;
  title: string;
  tagline: string;
  icon: IconName;
  category: CategoryId;
  component: ComponentType;
  /** Renders full-screen, without the boxed card or outer scroll padding. */
  fullBleed?: boolean;
  /** Matches the `tourId` each demo passes to `startTour`/`persist`. */
  tourId: string;
}

export const SECTIONS: SectionMeta[] = [
  {
    id: "basic-targeting",
    index: 1,
    title: "Targeting",
    tagline: "Point a step at a ref, or wrap it in <TourTarget>.",
    icon: "locate-outline",
    category: "targeting",
    component: BasicTargeting,
    tourId: "targeting",
  },
  {
    id: "themes",
    index: 2,
    title: "Themes",
    tagline: "Six built-in tooltip themes, swappable per tour.",
    icon: "color-palette-outline",
    category: "targeting",
    component: Themes,
    tourId: "themes",
  },
  {
    id: "custom-tooltip",
    index: 3,
    title: "Custom tooltip",
    tagline: "Swap the built-in tooltip for your own component.",
    icon: "chatbubble-ellipses-outline",
    category: "targeting",
    component: CustomTooltip,
    tourId: "custom",
  },
  {
    id: "backdrop-motion",
    index: 4,
    title: "Backdrop & motion",
    tagline: "Tap-to-advance, auto-advance, and instant transitions.",
    icon: "flash-outline",
    category: "behavior",
    component: BackdropAndMotion,
    tourId: "backdrop-motion",
  },
  {
    id: "persistence",
    index: 5,
    title: "Persistence",
    tagline: "Show a tour once, remember it with a storage adapter.",
    icon: "save-outline",
    category: "behavior",
    component: Persistence,
    tourId: "example-onboarding",
  },
  {
    id: "event-log",
    index: 6,
    title: "Event log",
    tagline: "Subscribe to the tour lifecycle for analytics.",
    icon: "pulse-outline",
    category: "behavior",
    component: EventLog,
    tourId: "events",
  },
  {
    id: "vertical-list",
    index: 7,
    title: "Vertical list",
    tagline: "Spotlight stays on the list while it scrolls.",
    icon: "list-outline",
    category: "scrolling",
    component: VerticalListTour,
    fullBleed: true,
    tourId: "vertical-list",
  },
  {
    id: "horizontal-list-controls",
    index: 8,
    title: "Horizontal + controls",
    tagline: "Paged cards. Swipe twice, then one step each on prev and next.",
    icon: "swap-horizontal-outline",
    category: "scrolling",
    component: HorizontalListControlsTour,
    fullBleed: true,
    tourId: "horizontal-list-controls",
  },
  {
    id: "paginated-cards",
    index: 9,
    title: "Paginated cards",
    tagline: "A paged carousel that advances on each swipe.",
    icon: "albums-outline",
    category: "scrolling",
    component: PaginatedCardsTour,
    fullBleed: true,
    tourId: "paginated",
  },
  {
    id: "pressable-controls",
    index: 10,
    title: "Pressable controls",
    tagline: "A step only advances when you press the real, live control.",
    icon: "hand-left-outline",
    category: "behavior",
    component: PressableControlsTour,
    tourId: "pressable-controls",
  },
  {
    id: "pass-through",
    index: 12,
    title: "Touch pass-through",
    tagline: "The spotlit button keeps its own onPress — the tour restates nothing.",
    icon: "radio-button-on-outline",
    category: "behavior",
    component: PassThroughTour,
    tourId: "pass-through",
  },
  {
    id: "cross-screen",
    index: 13,
    title: "Cross-screen",
    tagline: "A step navigates, then the next one's target mounts on the new screen.",
    icon: "arrow-redo-outline",
    category: "behavior",
    component: CrossScreenTour,
    fullBleed: true,
    tourId: "cross-screen",
  },
  {
    id: "wizard-navigation",
    index: 11,
    title: "Wizard navigation",
    tagline: "Same pager as Paginated cards, driven by circular Prev/Next.",
    icon: "chevron-forward-circle-outline",
    category: "scrolling",
    component: WizardNavigationTour,
    fullBleed: true,
    tourId: "wizard-navigation",
  },
];

export function sectionsByCategory(category: CategoryId): SectionMeta[] {
  return SECTIONS.filter((section) => section.category === category);
}
