import { execSync } from "child_process";
import { takeWhile } from "./takeWhile";

type Pane = {
  id: string;
  index: number;
  width: number;
  height: number;
  x: number;
  y: number;
  active: boolean;
};

type PaneResizeCommand =
  | {
      id: string;
      index: number;
      width: number;
    }
  | {
      id: string;
      index: number;
      height: number;
    };

const getPanes = (): Pane[] => {
  const stdout = execSync(
    `tmux list-pane -F "#{pane_id},#{pane_index},#{pane_width},#{pane_height},#{pane_left},#{pane_top},#{pane_active}"`
  ).toString();
  const panes = stdout
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => line.split(","))
    .map((splited) => ({
      id: splited[0],
      index: parseInt(splited[1]),
      width: parseInt(splited[2]),
      height: parseInt(splited[3]),
      x: parseInt(splited[4]),
      y: parseInt(splited[5]),
      active: splited[6] === "1",
    }));

  return panes;
};

const getActiveJoinedPanes = (
  panes: Pane[],
  mode: "horizontal" | "vertical"
): Pane[] => {
  const activePane = panes.find((pane) => pane.active);
  if (activePane === undefined) return [];

  const ascSortedPanes = panes.concat().sort((x, y) => x.index - y.index);
  const activePaneIndexInAscSortedPanes = ascSortedPanes.indexOf(activePane);
  const ascJoinedPanes = takeWhile(
    ascSortedPanes.slice(activePaneIndexInAscSortedPanes),
    (pane) =>
      mode === "horizontal" ? pane.y === activePane.y : pane.x === activePane.x
  );

  const descSortedPanes = panes.concat().sort((x, y) => y.index - x.index);
  const activePaneIndexInDescSortedPanes = descSortedPanes.indexOf(activePane);
  const descJoinedPanes = takeWhile(
    descSortedPanes.slice(activePaneIndexInDescSortedPanes),
    (pane) =>
      mode === "horizontal" ? pane.y === activePane.y : pane.x === activePane.x
  );

  return [...descJoinedPanes.slice(1), activePane, ...ascJoinedPanes.slice(1)];
};

const balancePaneSize = (
  panes: Pane[],
  mode: "horizontal" | "vertical"
): PaneResizeCommand[] => {
  if (panes.length <= 1) return [];

  const totalWidth = panes.reduce((acc, pane) => acc + pane.width, 0);
  const totalHeight = panes.reduce((acc, pane) => acc + pane.height, 0);
  const averageWidth = Math.round(totalWidth / panes.length);
  const averageHeight = Math.round(totalHeight / panes.length);

  if (mode === "horizontal")
    return panes.map((pane) => ({
      id: pane.id,
      index: pane.index,
      width: averageWidth,
    }));
  if (mode === "vertical")
    return panes.map((pane) => ({
      id: pane.id,
      index: pane.index,
      height: averageHeight,
    }));

  return mode satisfies never;
};

const execPaneResizeCommands = (commands: PaneResizeCommand[]) => {
  if (commands.length === 0) return;

  const tmuxCommands = commands
    .concat()
    .sort((x, y) => x.index - y.index)
    .map((command) => {
      if ("width" in command) {
        return `resize-pane -t ${command.id} -x ${command.width} \\;`;
      }
      if ("height" in command) {
        return `resize-pane -t ${command.id} -y ${command.height} \\;`;
      }
      return command satisfies never;
    })
    .join(" ");

  execSync(`tmux ${tmuxCommands}`);
};

const main = async () => {
  const panes = getPanes();
  const horizontalJoinedPanes = getActiveJoinedPanes(panes, "horizontal");
  const verticalJoinedPanes = getActiveJoinedPanes(panes, "vertical");

  const horizontalPaneResizeCommands = balancePaneSize(
    horizontalJoinedPanes,
    "horizontal"
  );
  const verticalPaneResizeCommands = balancePaneSize(
    verticalJoinedPanes,
    "vertical"
  );

  execPaneResizeCommands([
    ...horizontalPaneResizeCommands,
    ...verticalPaneResizeCommands,
  ]);
};
main();
