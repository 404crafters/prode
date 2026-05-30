"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { saveMatchPredictionAction, type SavePredictionState } from "./actions";

type PredictionFormProps = {
  matchId: string;
  stage: string;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  defaultValue: {
    homeGoals: number;
    awayGoals: number;
    predictedWinnerTeamId: string | null;
  } | null;
};

const initialState: SavePredictionState = {};

export function PredictionForm({
  matchId,
  stage,
  homeTeam,
  awayTeam,
  defaultValue,
}: PredictionFormProps) {
  const [state, formAction, pending] = useActionState(saveMatchPredictionAction, initialState);
  const [homeGoals, setHomeGoals] = useState(defaultValue?.homeGoals?.toString() ?? "");
  const [awayGoals, setAwayGoals] = useState(defaultValue?.awayGoals?.toString() ?? "");
  const isKnockout = stage !== "group";
  const needsPenaltyWinner = useMemo(() => {
    if (!isKnockout || homeGoals === "" || awayGoals === "") {
      return false;
    }

    return Number(homeGoals) === Number(awayGoals);
  }, [awayGoals, homeGoals, isKnockout]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input name="matchId" type="hidden" value={matchId} />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
          {homeTeam?.name ?? "Local"}
          <input
            className="field-control text-base"
            min={0}
            name="homeGoals"
            onChange={(event) => setHomeGoals(event.target.value)}
            required
            type="number"
            value={homeGoals}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
          {awayTeam?.name ?? "Visitante"}
          <input
            className="field-control text-base"
            min={0}
            name="awayGoals"
            onChange={(event) => setAwayGoals(event.target.value)}
            required
            type="number"
            value={awayGoals}
          />
        </label>
      </div>

      {isKnockout && needsPenaltyWinner ? (
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
          Ganador por penales
          <select
            className="field-control text-base"
            defaultValue={defaultValue?.predictedWinnerTeamId ?? ""}
            name="predictedWinnerTeamId"
            required
          >
            <option value="">Seleccionar ganador</option>
            {homeTeam ? <option value={homeTeam.id}>{homeTeam.name}</option> : null}
            {awayTeam ? <option value={awayTeam.id}>{awayTeam.name}</option> : null}
          </select>
        </label>
      ) : null}

      {isKnockout && !needsPenaltyWinner ? (
        <input name="predictedWinnerTeamId" type="hidden" value="" />
      ) : null}

      {state.error ? <p className="text-sm font-medium text-red-700">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm font-medium text-emerald-700">{state.success}</p>
      ) : null}

      <button
        className="primary-button"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando..." : "Guardar pronostico"}
      </button>
    </form>
  );
}
