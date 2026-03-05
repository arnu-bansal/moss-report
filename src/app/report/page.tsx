"use client";
import dynamic from "next/dynamic";
const Report = dynamic(() => import("../components/SimilarityReport"), { ssr: false });
export default function ReportPage() { return <Report />; }
