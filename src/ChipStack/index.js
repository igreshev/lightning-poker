import React from "react";
import Stack from "./Stack";
import { generateChipStack, CHIP_VALUES_REVERSED } from "../lib/utils";
import "./styles.scss";

function ChipStack({ chips }) {
  const chipStacks = generateChipStack(chips);

  return (
    <div className="stacks">
      {CHIP_VALUES_REVERSED.map(
        v => chipStacks[v] && <Stack value={v} key={v} amount={chipStacks[v]} />
      )}
    </div>
  );
}

export default ChipStack;