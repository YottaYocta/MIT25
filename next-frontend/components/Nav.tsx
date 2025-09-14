import Link from "next/link";
import Button from "./Button";
import { PlusIcon } from "lucide-react";

export const Nav = () => {
  return (
    <div className="fixed flex justify-center items-end gap-2 bottom-0 left-0 h-20 py-2 w-screen">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2862 90"
        fill="none"
        className="h-20 fixed bottom-0 -z-10"
      >
        <path
          d="M1 25.4997V88.9996H2861V25.4997H1480C1470.5 25.4997 1476.25 1.00023 1460 1.00002H1402C1385.75 0.999986 1392.5 25.4997 1380 25.4997H1Z"
          fill="url(#paint0_linear_131_15)"
          stroke="#DEE4FF"
        />
        <defs>
          <linearGradient
            id="paint0_linear_131_15"
            x1="1431"
            y1="1"
            x2="1431"
            y2="88.9996"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" />
            <stop offset="1" stop-color="#E9ECFF" />
          </linearGradient>
        </defs>
      </svg>

      <Link href={"/private"}>
        <Button className="h-8 w-32 justify-center">My Trinkets</Button>
      </Link>
      <Link href={"/upload"}>
        <Button className="w-16 h-16 rounded-full flex items-center justify-center">
          <PlusIcon></PlusIcon>
        </Button>
      </Link>

      <Link href={"/public"}>
        <Button className="h-8 w-32 justify-center">Public</Button>
      </Link>
    </div>
  );
};
