'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Activity, TrendingUp, Medal, AlertCircle, Target, Users, Zap, CheckCircle, PlayCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { PageHeader } from '@/components/ui/page-header'

// Helpers for time formatting
const parseTimeStringToSeconds = (timeStr: string) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(timeStr);
}

const formatSecondsToTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '00.00';
  if (seconds < 60) return seconds.toFixed(2);
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}

const normalizeEventName = (name: string) => {
  return name.replace(/\s+/g, '').toUpperCase();
}

export default function RecordAnalysisPage() {
  const supabase = createClient()
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | 'ALL'>('ALL')

  // Fetch Athletes
  const { data: athletes, isPending: athletesLoading } = useQuery({
    queryKey: ['athletes_for_analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('is_deleted', false)
        .order('grade', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true })
      if (error) throw error
      return data
    }
  })

  // Fetch Local Records
  const { data: localRecords, isPending: localLoading } = useQuery({
    queryKey: ['local_records_analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('is_deleted', false)
      if (error) throw error
      return data
    }
  })

  // Fetch Nationwide Rankings
  const { data: nationwide, isPending: nationwideLoading } = useQuery({
    queryKey: ['nationwide_records_analysis'],
    queryFn: async () => {
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      while (hasMore) {
        const { data, error } = await supabase
          .from('nationwide_rankings')
          .select('*')
          .eq('is_deleted', false)
          .range(page * 1000, (page + 1) * 1000 - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          if (data.length < 1000) hasMore = false;
        } else {
          hasMore = false;
        }
      }
      return allData;
    }
  })

  // Fetch Videos for recommendations
  const { data: trainingVideos, isPending: trainingLoading } = useQuery({
    queryKey: ['training_videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_videos')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: competitionVideos, isPending: compVideoLoading } = useQuery({
    queryKey: ['competition_videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_videos')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const isLoading = athletesLoading || localLoading || nationwideLoading || trainingLoading || compVideoLoading;

  const analysisData = useMemo(() => {
    if (!athletes || !localRecords || !nationwide) return null;

    // 1. Process nationwide data to find average and top times per event/gender
    const nwStats: Record<string, { total: number, count: number, min: number }> = {};
    nationwide.forEach(nw => {
      const eventKey = `${nw.gender}_${normalizeEventName(nw.event)}`;
      const timeInSec = parseTimeStringToSeconds(nw.record);
      if (timeInSec <= 0) return;

      if (!nwStats[eventKey]) {
        nwStats[eventKey] = { total: 0, count: 0, min: 9999 };
      }
      nwStats[eventKey].total += timeInSec;
      nwStats[eventKey].count += 1;
      if (timeInSec < nwStats[eventKey].min) {
        nwStats[eventKey].min = timeInSec;
      }
    });

    const nwBenchmarks: Record<string, { avg: number, top: number }> = {};
    Object.keys(nwStats).forEach(key => {
      nwBenchmarks[key] = {
        avg: nwStats[key].total / nwStats[key].count,
        top: nwStats[key].min
      };
    });

    // 2. Process local athletes
    const athleteAnalysis = athletes.map(athlete => {
      const aRecords = localRecords.filter(r => r.athlete_id === athlete.id);
      
      // Find best event based on comparison to nationwide average
      let bestEvent: any = null;
      let maxPercentile = -999;
      const eventDetails: any[] = [];

      aRecords.forEach(r => {
        const aGender = athlete.gender === 'M' ? '남자' : '여자';
        const eventKey = `${aGender}_${normalizeEventName(r.event_name)}`;
        const benchmark = nwBenchmarks[eventKey];
        if (!benchmark) return;

        const myTime = Number(r.record_time);
        if (!myTime) return;

        // How close to top? (Difference in percentage: lower time is better, so (avg - myTime) / avg
        const performanceRatio = benchmark.avg / myTime; // >1 means faster than average
        const isBetterThanAvg = myTime < benchmark.avg;
        
        // Find Personal Best per event
        const existingEvent = eventDetails.find(ed => ed.event === r.event_name);
        if (!existingEvent || myTime < existingEvent.myBest) {
          if (!existingEvent) {
            eventDetails.push({
              event: r.event_name,
              myBest: myTime,
              nwAvg: benchmark.avg,
              nwTop: benchmark.top,
              ratio: performanceRatio,
              isBetterThanAvg
            });
          } else {
            existingEvent.myBest = myTime;
            existingEvent.ratio = benchmark.avg / myTime;
            existingEvent.isBetterThanAvg = myTime < benchmark.avg;
          }
        }
      });

      eventDetails.forEach(ed => {
        if (ed.ratio > maxPercentile) {
          maxPercentile = ed.ratio;
          bestEvent = ed;
        }
      });

      // Generate Advice
      let advice = '';
      let focusArea = '';
      if (eventDetails.length === 0) {
        advice = '등록된 공식 기록이 없습니다. 다음 대회에서 공식 기록을 확보하는 것이 최우선 목표입니다.';
        focusArea = '기초 체력 및 기본기 훈련';
      } else if (athlete.name === '임지율') {
        advice = '제55회 전국소년체육대회를 대비하여 자유형 100M와 200M 종목에 집중적인 투자가 필요합니다. 자유형 100M는 폭발적인 스피드와 함께 흔들림 없는 코어 유지가 관건이며, 200M는 철저한 페이스 배분과 후반 스퍼트 능력이 메달권 진입을 좌우할 것입니다. 턴 동작에서의 저항을 최소화하고 돌핀킥의 비거리를 늘리는 디테일 훈련에 매진하세요.';
        focusArea = '자유형 100M/200M 레이스 운영 및 후반 스퍼트 강화';
      } else if (bestEvent) {
        if (bestEvent.ratio >= 1.10) {
          advice = `현재 ${bestEvent.event} 종목에서 전국 최상위권의 압도적인 기량을 보여주고 있습니다! 제55회 전국소년체육대회 금메달 획득을 위해 스타트 반응속도를 0.1초 단축하고, 피니시 터치 집중력을 극대화하는 미세 기술 교정에 집중하세요.`;
          focusArea = `${bestEvent.event} 금메달을 위한 스타트/턴 미세 교정`;
        } else if (bestEvent.ratio >= 1.02) {
          advice = `전국 평균을 상회하는 뛰어난 기량입니다. 제55회 전국소년체육대회 메달권 진입을 목표로, ${bestEvent.event} 종목의 레이스 중반부 페이스 유지 능력을 끌어올려야 합니다. 고강도 인터벌 훈련을 통해 젖산 내성을 키우세요.`;
          focusArea = `${bestEvent.event} 메달권 진입을 위한 젖산 내성 및 인터벌 훈련`;
        } else if (bestEvent.ratio >= 0.98) {
          advice = `전국 평균 수준의 기록을 보유하고 있습니다. 제55회 전국소년체육대회 본선 진출을 위해서는 ${bestEvent.event} 종목에서의 스트로크 효율(DPS)을 높이는 것이 핵심입니다. 불필요한 저항을 줄이는 유선형 자세 교정을 최우선으로 하세요.`;
          focusArea = `${bestEvent.event} 스트로크 효율(DPS) 개선 및 유선형 자세 교정`;
        } else if (bestEvent.ratio >= 0.90) {
          advice = `제55회 전국소년체육대회를 앞두고 전반적인 기록 단축이 필요한 시점입니다. 주 종목인 ${bestEvent.event}의 기초 지구력을 다지고, 팔 꺾기와 물잡기(캐치) 동작의 정확도를 높여 추진력을 극대화하는 훈련에 집중하세요.`;
          focusArea = `${bestEvent.event} 정확한 물잡기(캐치) 동작 및 기초 지구력 강화`;
        } else {
          advice = `제55회 전국소년체육대회를 대비하여 장기적인 관점에서 기초를 탄탄히 다지는 것이 중요합니다. ${bestEvent.event} 종목을 중심으로 코어 근력을 강화하고, 수중에서의 밸런스 유지 훈련을 통해 점진적인 기록 단축을 이뤄내세요.`;
          focusArea = `${bestEvent.event} 코어 근력 강화 및 수중 밸런스 기초 훈련`;
        }
      }

      return {
        ...athlete,
        eventDetails,
        bestEvent,
        advice,
        focusArea
      };
    }).filter(a => a.eventDetails.length > 0 || selectedAthleteId === a.id); // Filter out athletes with no records unless specifically selected

    return {
      athleteAnalysis,
      nwBenchmarks
    };
  }, [athletes, localRecords, nationwide, selectedAthleteId]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const selectedAthleteData = analysisData?.athleteAnalysis.find(a => a.id === selectedAthleteId);

  // Generate Recommended Videos
  const recommendedVideos = useMemo(() => {
    if (!selectedAthleteData || (!trainingVideos && !competitionVideos)) return [];
    
    let allVideos = [
      ...(trainingVideos || []).map((v: any) => ({ ...v, type: 'training' })),
      ...(competitionVideos || []).map((v: any) => ({ ...v, type: 'competition' }))
    ];

    if (allVideos.length === 0) return [];

    const focusEvent = selectedAthleteData.bestEvent?.event || '';
    const strokeType = focusEvent.split(' ')[0] || ''; // e.g. "자유형"

    // 1. Exact event match in title or description
    let matches = allVideos.filter(v => 
      (v.title && v.title.includes(focusEvent)) || 
      (v.description && v.description.includes(focusEvent))
    );

    // 2. If less than 3 matches, try stroke type match
    if (matches.length < 3 && strokeType) {
      const strokeMatches = allVideos.filter(v => 
        !matches.includes(v) &&
        ((v.title && v.title.includes(strokeType)) || 
         (v.description && v.description.includes(strokeType)) ||
         (v.category && v.category.includes(strokeType)) ||
         (v.sub_category && v.sub_category.includes(strokeType)))
      );
      matches = [...matches, ...strokeMatches];
    }

    // 3. Fill the rest with the most recent videos if still under 3
    if (matches.length < 3) {
      const remaining = allVideos.filter(v => !matches.includes(v)).slice(0, 5 - matches.length);
      matches = [...matches, ...remaining];
    }

    return matches.slice(0, 5); // Return up to 5 videos
  }, [selectedAthleteData, trainingVideos, competitionVideos]);

  return (
    <main className="space-y-6 pb-20">
      <PageHeader 
        title="기록 분석" 
        settingKey="record_analysis_desc"
        defaultDescription="전국 공식 기록 데이터와 한려초 선수 기록을 비교하여 훈련 방향을 제시합니다."
        icon={<Activity className="w-8 h-8 text-primary" />}
      />

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">분석 대상 선수 선택</h2>
            <p className="text-sm text-slate-500">분석할 선수를 선택하면 전국 기록과의 상세 비교 차트 및 맞춤 훈련 조언을 확인할 수 있습니다.</p>
          </div>
          <select 
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="w-full sm:w-64 px-4 py-3 rounded-xl border border-slate-200 focus:border-primary outline-none font-medium bg-slate-50"
          >
            <option value="ALL">전체 선수 요약 보기</option>
            {athletes?.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.grade ? `${a.grade}학년` : '학년미상'})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedAthleteId === 'ALL' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analysisData?.athleteAnalysis.map((athlete) => (
            <div key={athlete.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedAthleteId(athlete.id)}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800">{athlete.name}</h3>
                  <p className="text-sm text-slate-500">{athlete.grade}학년 | {athlete.gender === 'M' ? '남' : '여'}</p>
                </div>
                {athlete.bestEvent?.ratio >= 1.0 && (
                  <div className="p-2 bg-amber-50 text-amber-500 rounded-xl" title="전국 평균 이상">
                    <Medal className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-1">주력 종목 (Best Event)</p>
                  <p className="font-bold text-primary">{athlete.bestEvent ? athlete.bestEvent.event : '기록 없음'}</p>
                </div>
                
                {athlete.bestEvent && (
                  <div>
                     <p className="text-xs font-bold text-slate-400 mb-1">전국 평균 대비 성취도</p>
                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={`h-full rounded-full ${athlete.bestEvent.ratio >= 1 ? 'bg-emerald-400' : 'bg-primary'}`} 
                         style={{ width: `${Math.min((athlete.bestEvent.ratio) * 100, 100)}%` }}
                       ></div>
                     </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 mb-1">훈련 포커스</p>
                  <p className="text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded-lg">{athlete.focusArea}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : selectedAthleteData ? (
        <div className="space-y-6">
          {/* AI Advice Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-primary text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Zap className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">{selectedAthleteData.name} 선수 맞춤형 분석 리포트</h2>
                  <p className="text-indigo-100">데이터 기반 훈련 어드바이스</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h3 className="font-bold flex items-center gap-2 mb-3 text-indigo-50"><Target className="w-5 h-5 text-amber-300" /> 집중 훈련 영역</h3>
                  <p className="text-xl font-bold text-white">{selectedAthleteData.focusArea}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h3 className="font-bold flex items-center gap-2 mb-3 text-indigo-50"><TrendingUp className="w-5 h-5 text-emerald-300" /> 코칭 어드바이스</h3>
                  <p className="text-sm text-indigo-50 leading-relaxed">{selectedAthleteData.advice}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          {selectedAthleteData.eventDetails.length > 0 ? (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" /> 전국 기록 비교 차트
              </h3>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedAthleteData.eventDetails.map((ed: any) => ({
                      name: ed.event,
                      '내 기록': parseFloat(((ed.nwAvg / ed.myBest) * 100).toFixed(1)),
                      '전국 평균': 100,
                      '전국 1위': parseFloat(((ed.nwAvg / ed.nwTop) * 100).toFixed(1)),
                      myTimeVal: ed.myBest,
                      nwAvgVal: ed.nwAvg,
                      nwTopVal: ed.nwTop
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B' }}
                      label={{ value: '전국 평균 대비 성취율 (%) - 높을수록 우수', angle: -90, position: 'insideLeft', style: { fill: '#94A3B8', fontSize: 12 } }} 
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F1F5F9' }}
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                              <p className="font-bold text-slate-800 mb-2">{label}</p>
                              {payload.map((p: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 mb-1">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                                  <span className="text-sm font-medium text-slate-600">{p.name}:</span>
                                  <span className="text-sm font-bold" style={{ color: p.color }}>
                                    {p.name === '내 기록' ? formatSecondsToTime(p.payload.myTimeVal) : 
                                     p.name === '전국 평균' ? formatSecondsToTime(p.payload.nwAvgVal) : 
                                     formatSecondsToTime(p.payload.nwTopVal)}
                                    <span className="text-xs text-slate-400 ml-1">({p.value}%)</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="내 기록" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="전국 1위" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="전국 평균" fill="#94A3B8" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">* 성취율(%)이 높을수록(막대가 위로 솟을수록) 전국 평균(100%) 대비 더 빠른 기록임을 의미합니다.</p>
            </div>
          ) : (
            <div className="bg-slate-50 p-12 rounded-3xl text-center border border-slate-100">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-600">비교할 공식 기록이 없습니다.</h3>
              <p className="text-slate-500 mt-2">선수 기록 메뉴에서 대회 기록을 먼저 등록해주세요.</p>
            </div>
          )}

          {/* Detailed Data Table */}
          {selectedAthleteData.eventDetails.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">종목별 상세 분석표</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                      <th className="p-4 font-bold whitespace-nowrap">참가 종목</th>
                      <th className="p-4 font-bold whitespace-nowrap">최고 기록</th>
                      <th className="p-4 font-bold whitespace-nowrap">전국 평균</th>
                      <th className="p-4 font-bold whitespace-nowrap">전국 1위</th>
                      <th className="p-4 font-bold whitespace-nowrap">평균 격차</th>
                      <th className="p-4 font-bold whitespace-nowrap">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAthleteData.eventDetails.map((ed: any, idx: number) => {
                      const diff = ed.myBest - ed.nwAvg;
                      const isGood = diff <= 0;
                      
                      let statusText = '';
                      let statusBadgeClass = '';
                      let StatusIcon = null;

                      if (ed.ratio >= 1.10) {
                        statusText = '최고 수준';
                        statusBadgeClass = 'bg-indigo-100 text-indigo-700';
                        StatusIcon = Medal;
                      } else if (ed.ratio >= 1.02) {
                        statusText = '평균 이상';
                        statusBadgeClass = 'bg-emerald-100 text-emerald-700';
                        StatusIcon = TrendingUp;
                      } else if (ed.ratio >= 0.98) {
                        statusText = '평균 수준';
                        statusBadgeClass = 'bg-blue-100 text-blue-700';
                        StatusIcon = CheckCircle;
                      } else if (ed.ratio >= 0.90) {
                        statusText = '단축 필요';
                        statusBadgeClass = 'bg-amber-100 text-amber-700';
                        StatusIcon = Target;
                      } else {
                        statusText = '노력 요함';
                        statusBadgeClass = 'bg-rose-100 text-rose-700';
                        StatusIcon = AlertCircle;
                      }

                      return (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-700">{ed.event}</td>
                          <td className="p-4 font-bold text-primary">{formatSecondsToTime(ed.myBest)}</td>
                          <td className="p-4 font-medium text-slate-500">{formatSecondsToTime(ed.nwAvg)}</td>
                          <td className="p-4 font-bold text-amber-500">{formatSecondsToTime(ed.nwTop)}</td>
                          <td className="p-4 font-medium">
                            <span className={isGood ? 'text-emerald-500' : 'text-rose-500'}>
                              {isGood ? '-' : '+'}{Math.abs(diff).toFixed(2)}초
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass}`}>
                              <StatusIcon className="w-3 h-3" /> {statusText}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommended Videos */}
          {recommendedVideos.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <PlayCircle className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-bold text-slate-800">실력 향상 추천 영상</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6">현재 기록을 바탕으로 집중 훈련이 필요한 종목({selectedAthleteData.bestEvent?.event})의 추천 영상입니다.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recommendedVideos.map((video: any) => (
                  <a 
                    key={video.id} 
                    href={video.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-3 border border-slate-200 group-hover:border-primary/30 transition-colors">
                      <img 
                        src={`https://img.youtube.com/vi/${video.url.split('v=')[1]?.split('&')[0] || video.url.split('/').pop()}/mqdefault.jpg`} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-video.svg'; // Fallback image if youtube thumbnail fails
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded-lg text-white text-xs font-bold shadow-sm">
                        {video.type === 'training' ? '수영 영상' : '대회 영상'}
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 line-clamp-2 text-sm group-hover:text-primary transition-colors">{video.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{video.description || '선수 맞춤형 추천 영상'}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </main>
  )
}
