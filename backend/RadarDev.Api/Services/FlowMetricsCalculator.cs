using System.Globalization;
using RadarDev.Api.Models.Raw;

namespace RadarDev.Api.Services;

public static class FlowMetricsCalculator
{
    /// <summary>
    /// Reconstrói as datas de entrada nas colunas de início e fim a partir do histórico de transições.
    /// Regra de re-trabalho (D-018): primeira entrada em startStates, primeira entrada em endStates.
    /// </summary>
    public static CardFlow Compute(
        IEnumerable<WorkItemUpdateRaw> updates,
        ISet<string> startStates,
        ISet<string> endStates)
    {
        DateTime? entryStart = null;
        DateTime? entryEnd = null;

        foreach (var update in updates.OrderBy(u => u.RevisedDate))
        {
            var newState = update.Fields?.State?.NewValue;
            if (newState == null) continue;

            if (entryStart == null && startStates.Contains(newState))
                entryStart = update.RevisedDate;

            if (entryEnd == null && endStates.Contains(newState))
                entryEnd = update.RevisedDate;
        }

        return new CardFlow(entryStart, entryEnd);
    }

    /// <summary>
    /// Calcula o percentil usando interpolação linear (método padrão para flow metrics).
    /// </summary>
    public static double Percentile(IReadOnlyList<double> sortedValues, int p)
    {
        if (sortedValues.Count == 0) return 0;
        if (sortedValues.Count == 1) return sortedValues[0];

        double index = (p / 100.0) * (sortedValues.Count - 1);
        int lower = (int)Math.Floor(index);
        int upper = (int)Math.Ceiling(index);
        double fraction = index - lower;

        return sortedValues[lower] + fraction * (sortedValues[upper] - sortedValues[lower]);
    }

    /// <summary>
    /// Retorna ano ISO e número da semana ISO para uma data.
    /// </summary>
    public static (int IsoYear, int IsoWeek) GetIsoWeek(DateTime date)
    {
        var cal = CultureInfo.InvariantCulture.Calendar;
        int week = cal.GetWeekOfYear(date, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);

        // Ajusta o ano ISO: dias no início do ano que pertencem à última semana do ano anterior
        int year = date.Year;
        if (week >= 52 && date.Month == 1) year--;
        if (week == 1 && date.Month == 12) year++;

        return (year, week);
    }

    /// <summary>
    /// Retorna a data de início (segunda-feira) de uma semana ISO.
    /// </summary>
    public static DateTime GetWeekStart(int isoYear, int isoWeek)
    {
        // 4 de janeiro está sempre na semana 1 do ano ISO
        var jan4 = new DateTime(isoYear, 1, 4);
        int dayOfWeek = (int)jan4.DayOfWeek;
        if (dayOfWeek == 0) dayOfWeek = 7; // domingo = 7
        var week1Monday = jan4.AddDays(1 - dayOfWeek);
        return week1Monday.AddDays((isoWeek - 1) * 7);
    }
}

public record CardFlow(DateTime? EntryStart, DateTime? EntryEnd);
