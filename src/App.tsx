import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { throttle } from '@solid-primitives/scheduled';
// eslint-disable-next-line import/no-named-as-default
import Graph from 'graphology';
// import { inferSettings } from 'graphology-layout-forceatlas2';
// import ForceAtlas2 from 'graphology-layout-forceatlas2/worker';
// eslint-disable-next-line import/no-named-as-default
import Sigma from 'sigma';
import { IoClose, IoHourglass, IoSearch } from 'solid-icons/io';

import EdgeArrowProgram from './lib/edge-arrow/edge.arrow';
import NodeSelectedProgram from './lib/node-selected';
import { drawDetailedNodeLabel, drawSimpleNodeLabel } from './util';

// const clamp = (value: number, min: number, max: number) =>
//   Math.min(Math.max(value, min), max);

// map range to another range

// const map = (
//   value: number,
//   range1: [number, number],
//   range2: [number, number],
// ) => {
//   const [min1, max1] = range1;
//   const [min2, max2] = range2;
//   return ((value - min1) * (max2 - min2)) / (max1 - min1) + min2;
// };

// type Node = {
//   id: string;
//   label: string;
//   groupID: string;
// };

// type Link = {
//   source: string;
//   target: string;
// };

export default function App() {
  const [displayMessage, setDisplayMessage] = createSignal(true);
  const [isLoading, setLoading] = createSignal(false);
  const [search, setSearch] = createSignal('');
  const throttleSetSearch = throttle(setSearch, 250);

  const state: { selectedNode: string | undefined } = {
    selectedNode: undefined,
  };

  let container: HTMLDivElement | undefined;
  let renderer: Sigma | undefined;
  let graph: Graph | undefined;

  //   const global: { graph?: Graph; layout?: ForceAtlas2 } = {};

  //   function handleStopSimulation() {
  //     // after 30 seconds stop workers
  //     global.layout?.stop();
  //     global.layout?.kill();
  //     console.log('layout..');

  //     console.log('done.');

  //     console.log('exporting...');
  //     // export graph to json
  //     const json = global.graph?.toJSON();
  //     const blob = new Blob([JSON.stringify(json)], {
  //       type: 'application/json',
  //     });
  //     const url = URL.createObjectURL(blob);

  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = 'graph.json';
  //     a.click();
  //     a.remove();
  //     URL.revokeObjectURL(url);
  //   }

  createEffect(() => {
    setLoading(true);
    const label = search();
    try {
      const node = graph?.filterNodes(
        (n) =>
          graph?.getNodeAttribute(n, 'label').toUpperCase() ===
          label.toUpperCase(),
      );

      if (node && node.length > 0) {
        selectNode(node[0]);
      }
    } catch (error) {}
    setLoading(false);
  });

  onMount(async () => {
    if (!container) return;

    await createNetwork(container);
  });

  function zoomToNode(id: string) {
    const node = renderer?.getNodeDisplayData(id);
    if (!node) return; // node not found
    // const { x, y } = node;

    const camera = renderer?.getCamera();

    function calculateZoomToFitNodes(
      nodeIDs: string[],
      width: number,
      height: number,
    ): number {
      // Find the minimum and maximum x and y coordinates
      const minX = Math.min(
        ...nodeIDs.map((id) => graph?.getNodeAttribute(id, 'x')),
      );
      const maxX = Math.max(
        ...nodeIDs.map((id) => graph?.getNodeAttribute(id, 'x')),
      );
      const minY = Math.min(
        ...nodeIDs.map((id) => graph?.getNodeAttribute(id, 'y')),
      );
      const maxY = Math.max(
        ...nodeIDs.map((id) => graph?.getNodeAttribute(id, 'y')),
      );

      // Calculate the width and height of the bounding box
      const boundingBoxWidth = maxX - minX;
      const boundingBoxHeight = maxY - minY;

      // Determine the scaling factor required to fit the bounding box
      const scaleX = width / boundingBoxWidth;
      const scaleY = height / boundingBoxHeight;
      const scale = Math.min(scaleX, scaleY);

      // Convert the scaling factor to a zoom value compatible with SigmaJS
      // Assuming a zoom value of 1 represents the original size
      const zoom = 1 / scale;

      return zoom;
    }

    // camera?.animate({ x, y, ratio: map(node.size, [2, 12], [0.02, 0.2]) });

    // get node edge's
    const edgeNodesTarget =
      graph?.edges(id).map((edge) => graph?.target(edge) || '') || [];

    const zoom = calculateZoomToFitNodes(
      [...edgeNodesTarget, id],
      container?.offsetWidth || 0,
      container?.offsetHeight || 0,
    );

    camera?.animate({
      x: node.x,
      y: node.y,
      ratio: Math.max(zoom, 0.05),
    });
  }

  function selectNode(id?: string) {
    // If the new node is the same as the currently selected node, do nothing
    if (state.selectedNode === id) return;

    const nodesToRefresh = [];

    // Deselect the previously selected node (if different from the new node)
    if (state.selectedNode && state.selectedNode !== id) {
      graph?.setNodeAttribute(state.selectedNode, 'type', 'circle');
      nodesToRefresh.push(state.selectedNode);
    }

    // Select the new node or deselect if no node is provided
    if (id) {
      graph?.setNodeAttribute(id, 'type', 'selectedNode');
      nodesToRefresh.push(id);
      setSearch(graph?.getNodeAttribute(id, 'label'));
      zoomToNode(id);
    } else {
      setSearch('');
    }

    state.selectedNode = id;

    renderer?.refresh({
      partialGraph: {
        nodes: graph?.nodes(), // refresh every node
        edges: graph?.edges(), // refresh every edge
      },
      skipIndexation: true,
    });
  }

  async function createNetwork(container: HTMLDivElement) {
    console.log('fetching...');
    // const courses = (
    //   (await fetch('/courses_all.json').then((res) => res.json())) as any[]
    // ).splice(0, 2500);
    // const courses = (await fetch('/courses_all.json').then((res) =>
    //   res.json(),
    // )) as any[];

    // console.log('done.', courses.length);

    // const groupIDs: Record<string, number> = {};
    // const data = {
    //   nodes: courses.map((data) => {
    //     const label = `${data.code} ${data.number}${data.suffix || ''}`;

    //     groupIDs[data.code] = (groupIDs[data.code] || 0) + 1;

    //     return {
    //       id: data.id,
    //       label,
    //       title: data.title,
    //       groupID: data.code,
    //     };
    //   }),
    //   links: (() => {
    //     const links = [];
    //     for (let i = 0; i < courses.length; i++) {
    //       const course = courses[i];
    //       // prerequisites
    //       for (const prerequisite of course.prerequisites) {
    //         // check if prereq is in courses
    //         const index = courses.findIndex((c) => c.id === prerequisite);
    //         if (index === -1) continue;
    //         links.push({
    //           source: course.id,
    //           target: prerequisite,
    //         });
    //       }
    //       // concurrent
    //       for (const concurrent of course.concurrent) {
    //         // check if concurrent is in courses
    //         const index = courses.findIndex((c) => c.id === concurrent);
    //         if (index === -1) continue;
    //         links.push({
    //           source: course.id,
    //           target: concurrent,
    //         });
    //       }
    //       // corequisites
    //       for (const corequisite of course.corequisites) {
    //         // check if coreq is in courses
    //         const index = courses.findIndex((c) => c.id === corequisite);
    //         if (index === -1) continue;
    //         links.push({
    //           source: course.id,
    //           target: corequisite,
    //         });
    //       }
    //       // recommendation
    //       for (const recommended of course.recommended) {
    //         // check if recommended is in courses
    //         const index = courses.findIndex((c) => c.id === recommended);
    //         if (index === -1) continue;
    //         links.push({
    //           source: course.id,
    //           target: recommended,
    //         });
    //       }
    //     }
    //     return links;
    //   })(),
    // };

    // type ColorMap = { [id: string]: string };

    // function rainbowColor(value: number): string {
    //   const h = value * 360;
    //   const s = 0.5; // Adjust saturation (0-1)
    //   const l = 0.6; // Adjust lightness/brightness (0-1)

    //   const c = (1 - Math.abs(2 * l - 1)) * s;
    //   const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    //   const m = l - c / 2;

    //   let r = 0;
    //   let g = 0;
    //   let b = 0;
    //   if (h >= 0 && h < 60) {
    //     r = c;
    //     g = x;
    //   } else if (h >= 60 && h < 120) {
    //     r = x;
    //     g = c;
    //   } else if (h >= 120 && h < 180) {
    //     g = c;
    //     b = x;
    //   } else if (h >= 180 && h < 240) {
    //     g = x;
    //     b = c;
    //   } else if (h >= 240 && h < 300) {
    //     r = x;
    //     b = c;
    //   } else if (h >= 300 && h < 360) {
    //     r = c;
    //     b = x;
    //   }

    //   r = Math.round((r + m) * 255);
    //   g = Math.round((g + m) * 255);
    //   b = Math.round((b + m) * 255);

    //   return `rgb(${r}, ${g}, ${b})`;
    // }

    // function assignColorsToIDs(ids: string[]): ColorMap {
    //   return ids.reduce((colors: ColorMap, id: string, index: number) => {
    //     colors[id] = rainbowColor(index / ids.length);
    //     return colors;
    //   }, {});
    // }

    // const groupColors = assignColorsToIDs(Object.keys(groupIDs));

    const graphImport = (await fetch('/graph.json').then((res) =>
      res.json(),
    )) as any[];

    graph = new Graph({ multi: true }).import(graphImport as any);

    // organize nodes with most amount of `linkCount`
    // const sortedNodes = data.nodes.slice().sort((a, b) => {
    //   const linkCountA =
    //     data.links.filter((l) => l.target === a.id).length +
    //     data.links.filter((l) => l.source === a.id).length;
    //   const linkCountB =
    //     data.links.filter((l) => l.target === b.id).length +
    //     data.links.filter((l) => l.source === b.id).length;
    //   return linkCountB - linkCountA;
    // });

    // sortedNodes.forEach((node) => {
    //   const linkCount =
    //     data.links.filter((l) => l.target === node.id).length +
    //     data.links.filter((l) => l.source === node.id).length;

    //   graph.addNode(node.id, {
    //     label: node.label,
    //     title: node.title,
    //     // set size equal to amount of targets it has
    //     size: clamp(map(linkCount, [0, 182], [2, 12]), 2, 12),
    //     // size: 10,
    //     x: Math.random() * 50,
    //     y: Math.random() * 50,
    //     color: groupColors[node.groupID],
    //   });
    // });

    // data.links.forEach((link) => {
    //   const color: string = graph
    //     .getNodeAttributes(link.source)
    //     .color.replace('rgb(', '')
    //     .replace(')', '');
    //   graph.addEdge(link.target, link.source, {
    //     type: 'arrow',
    //     // color of source
    //     color: `rgba(${color}, 0.3)`,
    //   });
    // });

    // const sensibleSettings = inferSettings(graph);
    // const layout = new ForceAtlas2(graph, {
    //   settings: {
    //     ...sensibleSettings,
    //     barnesHutOptimize: true,
    //     gravity: 2,
    //     strongGravityMode: true,
    //   },
    // });

    // layout.start();

    // const nooverlap = new NoOverlap(graph);
    // global.graph = graph;
    // global.layout = layout;

    renderer = new Sigma(graph, container, {
      labelColor: { color: '#fff' },
      nodeProgramClasses: {
        selectedNode: NodeSelectedProgram,
      },
      edgeProgramClasses: {
        arrow: EdgeArrowProgram,
      },
      defaultDrawNodeLabel(
        context: CanvasRenderingContext2D,
        data: any,
        settings: any,
      ): void {
        if (!data.label) return;

        drawSimpleNodeLabel(context, data, settings);
      },
      defaultDrawNodeHover(
        context: CanvasRenderingContext2D,
        data: any,
        settings: any,
      ) {
        drawDetailedNodeLabel(context, data, settings);
      },
      nodeReducer(_: any, data: any) {
        const res = { ...data };

        return res;
      },
      edgeReducer(id, data) {
        const res = { ...data };

        console.log(res.type);

        if (
          state.selectedNode &&
          !graph?.hasExtremity(id, state.selectedNode)
        ) {
          res.hidden = true;
        }

        return res;
      },
    });

    const changeCursor = (type: string) => {
      const container = renderer?.getContainer();
      if (container) container.style.cursor = type;
    };

    renderer.on('enterStage', () => {
      changeCursor('grab');
    });

    renderer.on('downStage', () => {
      changeCursor('grabbing');
    });
    renderer.on('upStage', () => {
      changeCursor('grab');
    });

    renderer.on('leaveStage', () => {
      changeCursor('default');
    });

    renderer.on('enterNode', () => {
      changeCursor('pointer');
    });

    renderer.on('downNode', () => {
      changeCursor('pointer');
    });

    renderer.on('leaveNode', () => {
      changeCursor('grab');
    });

    renderer.on('clickStage', () => {
      selectNode(undefined);
    });

    renderer.on('clickNode', (e) => {
      selectNode(e.node);
    });
  }

  onCleanup(() => {
    renderer && renderer.kill();
  });

  return (
    <main class="h-screen w-screen">
      {/* message */}
      <Show when={displayMessage()}>
        <div class="fixed bottom-0 right-0 z-10 flex w-full max-w-sm p-2">
          <div class="h-auto w-full items-center rounded-md border border-neutral-600 bg-neutral-900/75 p-4 py-3 text-sm text-white  outline-none backdrop-blur-sm">
            <div class="mb-4 flex justify-between ">
              <h1 class="text-base font-bold text-white">Quick Message</h1>
              <button onClick={() => setDisplayMessage(false)}>
                <IoClose size={20} />
              </button>
            </div>
            <p>
              Hello! Thanks for checking this project out. I spent a lot of time
              gathering data and I quickly put together this visualization tool
              so people can play with it. This project is still in "alpha," so I
              still have a lot planned on the way.
            </p>
            <br />
            <p>
              If you are someone with ideas, can help with web development, or
              just want to comment about something feel free to{' '}
              <a
                href="mailto:nabeelahmed1721@gmail.com"
                class="text-blue-500 underline transition-colors duration-200 ease-in-out hover:text-blue-400"
              >
                reach out to me.
              </a>
            </p>
          </div>
        </div>
      </Show>

      {/* search bar */}
      <div class="fixed top-0 z-10 flex w-full items-center justify-center p-2">
        <div class="flex h-auto max-w-lg items-center rounded-full border border-neutral-600 bg-neutral-900/75 text-sm text-white outline-none backdrop-blur-sm">
          <div class="mr-2 p-4 py-3 pr-0">
            <IoSearch class="size-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Filter a course..."
            class="w-full bg-transparent p-4 py-3 pl-2 text-neutral-100  focus:outline-none"
            value={search()}
            onInput={(e) => throttleSetSearch(e.target.value)}
          />
        </div>
        <Show when={isLoading()}>
          <div class="ml-2 p-4 py-3 pl-0">
            <IoHourglass class="size-5 text-gray-400" />
          </div>
        </Show>
      </div>
      <div class="flex size-full items-center justify-center" ref={container} />
    </main>
  );
}
