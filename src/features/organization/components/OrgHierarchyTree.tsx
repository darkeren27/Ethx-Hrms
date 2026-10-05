import React, { useState, useMemo, useRef } from 'react';
import { 
  Building, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Search, 
  X, 
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Filter,
  Layers,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  DollarSign,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Printer,
  ChevronUp,
  LayoutGrid,
  ListFilter
} from 'lucide-react';
import { OrgNode, OrgTier } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface OrgHierarchyTreeProps {
  rootNode: OrgNode;
  onSelectNode: (node: OrgNode) => void;
  onStartReorg?: (node: OrgNode) => void;
}

export const OrgHierarchyTree: React.FC<OrgHierarchyTreeProps> = ({
  rootNode,
  onSelectNode,
  onStartReorg
}) => {
  const [zoom, setZoom] = useState<number>(0.85);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedModality, setSelectedModality] = useState<'All' | 'Pune HQ' | 'Contract WFH'>('All');
  const [cardDensity, setCardDensity] = useState<'standard' | 'compact'>('standard');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [focusedRootId, setFocusedRootId] = useState<string>(rootNode.id);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-center canvas on mount or sub-tree drill-down
  React.useEffect(() => {
    if (canvasRef.current) {
      const scrollWidth = canvasRef.current.scrollWidth;
      const clientWidth = canvasRef.current.clientWidth;
      if (scrollWidth > clientWidth) {
        canvasRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
      }
    }
  }, [focusedRootId, cardDensity]);

  // Find node by ID
  const findNode = (curr: OrgNode, id: string): OrgNode | null => {
    if (curr.id === id) return curr;
    if (curr.children) {
      for (const child of curr.children) {
        const res = findNode(child, id);
        if (res) return res;
      }
    }
    return null;
  };

  // Active displayed root (allows drill-down to a specific manager's branch)
  const activeRoot = useMemo(() => {
    return findNode(rootNode, focusedRootId) || rootNode;
  }, [rootNode, focusedRootId]);

  // Breadcrumb path from global root to currently focused sub-root
  const breadcrumbTrail = useMemo(() => {
    const trail: OrgNode[] = [];
    function buildTrail(curr: OrgNode, targetId: string, currentPath: OrgNode[]): boolean {
      if (curr.id === targetId) {
        trail.push(...currentPath, curr);
        return true;
      }
      if (curr.children) {
        for (const child of curr.children) {
          if (buildTrail(child, targetId, [...currentPath, curr])) {
            return true;
          }
        }
      }
      return false;
    }
    buildTrail(rootNode, focusedRootId, []);
    return trail;
  }, [rootNode, focusedRootId]);

  // Track expanded state of nodes
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'ETHX-001': true,
    'ETHX-002': true,
    'ETHX-004': true,
    'ETHX-005': true,
    'ETHX-008': true,
    'ETHX-003': true,
    'ETHX-012': true,
  });

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allIds: Record<string, boolean> = {};
    function collect(node: OrgNode) {
      allIds[node.id] = true;
      if (node.children) node.children.forEach(collect);
    }
    collect(rootNode);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes({ [activeRoot.id]: false });
  };

  const collapseToDirectors = () => {
    const next: Record<string, boolean> = { [rootNode.id]: true };
    if (rootNode.children) {
      rootNode.children.forEach((c) => {
        next[c.id] = false;
      });
    }
    setExpandedNodes(next);
  };

  // Search matching nodes
  const matchingNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const query = searchQuery.toLowerCase();
    const matches = new Set<string>();

    function searchRec(node: OrgNode): boolean {
      let isMatch = 
        node.name.toLowerCase().includes(query) ||
        node.role.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query) ||
        node.department.toLowerCase().includes(query) ||
        node.location.toLowerCase().includes(query) ||
        (node.workModality && node.workModality.toLowerCase().includes(query)) ||
        (node.contractType && node.contractType.toLowerCase().includes(query)) ||
        node.skills.some(s => s.toLowerCase().includes(query));

      if (node.children) {
        for (const child of node.children) {
          if (searchRec(child)) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        matches.add(node.id);
      }
      return isMatch;
    }

    searchRec(rootNode);
    return matches;
  }, [searchQuery, rootNode]);

  // If search query is entered, auto-expand matching nodes
  React.useEffect(() => {
    if (matchingNodeIds.size > 0) {
      setExpandedNodes((prev) => {
        const next = { ...prev };
        matchingNodeIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });
    }
  }, [matchingNodeIds]);

  // Professional Department accent styles
  const deptAccentColors: Record<string, { border: string; bar: string; badge: string }> = {
    'DEP-EXEC': {
      border: 'hover:border-brand-red/80',
      bar: 'bg-gradient-to-r from-brand-red via-brand-red-hover to-brand-red',
      badge: 'bg-brand-red/15 text-brand-red border-brand-red/30',
    },
    'DEP-ENG': {
      border: 'hover:border-sky-500/80',
      bar: 'bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-500',
      badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    'DEP-FIN': {
      border: 'hover:border-emerald-500/80',
      bar: 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    'DEP-HR': {
      border: 'hover:border-amber-500/80',
      bar: 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    'DEP-SALES': {
      border: 'hover:border-purple-500/80',
      bar: 'bg-gradient-to-r from-purple-500 via-purple-400 to-pink-500',
      badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
  };

  const tierBadges: Record<OrgTier, string> = {
    'C-Suite': 'bg-brand-red/15 text-brand-red border-brand-red/30',
    'Director': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    'Lead Architect': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Specialist': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Engineer': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    'Associate': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };

  const renderNode = (node: OrgNode, isSubtreeRoot: boolean = false) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = !!node.children && node.children.length > 0;
    
    // Direct match highlight
    const isDirectMatch = searchQuery.trim() && (
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter checks
    const matchesDept = selectedDept === 'All' || node.departmentId === selectedDept || node.department.includes(selectedDept);
    const matchesTier = selectedTier === 'All' || node.tier === selectedTier;
    const matchesModality = selectedModality === 'All' || node.workModality === selectedModality;
    const isVisible = matchesDept && matchesTier && matchesModality;

    const accent = deptAccentColors[node.departmentId] || deptAccentColors['DEP-ENG'];
    const tierBadge = tierBadges[node.tier] || tierBadges['Specialist'];

    return (
      <div key={node.id} className="flex flex-col items-center select-none transition-all duration-300">
        {/* Node Card */}
        <div
          className={`relative group transition-all duration-300 ${!isVisible ? 'opacity-35 grayscale-[50%]' : 'opacity-100'}`}
          onClick={() => onSelectNode(node)}
        >
          {/* Subtle Glow Aura on Direct Search Match or Hover */}
          <div
            className={`absolute -inset-1 rounded-2xl bg-brand-red/25 blur-md transition-opacity duration-300 pointer-events-none ${
              isDirectMatch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          />

          {cardDensity === 'standard' ? (
            /* Standard Enterprise Card */
            <div
              className={`relative w-[320px] bg-brand-card/95 border rounded-2xl p-4 shadow-card-dark transition-all duration-200 cursor-pointer backdrop-blur-md overflow-hidden ${
                isDirectMatch
                  ? 'border-brand-red ring-2 ring-brand-red/60 shadow-glow-red'
                  : `border-brand-border/80 ${accent.border} hover:-translate-y-1 hover:shadow-card-elevated`
              }`}
            >
              {/* Department Accent Stripe on Card Top */}
              <div className={`h-1 w-full absolute top-0 left-0 ${accent.bar}`} />

              {/* Header row: Tier, Grade, Modality & Employee ID */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/5 pt-0.5 gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${tierBadge}`}>
                    {node.tier}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-brand-slate border border-white/10">
                    {node.jobGrade}
                  </span>
                  {node.workModality === 'Pune HQ' ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1" title="Pune Global HQ (Main Campus)">
                      🏢 Pune HQ
                    </span>
                  ) : node.workModality === 'Contract WFH' ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1" title="Contract-Based Work From Home">
                      💻 Contract WFH
                    </span>
                  ) : null}
                </div>
                <span className="font-mono text-[11px] font-bold text-brand-slate/90 tracking-wider shrink-0">
                  {node.id}
                </span>
              </div>

              {/* Profile row: Fixed Avatar with status ring */}
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={node.avatar}
                    alt={node.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-border group-hover:ring-brand-red/70 transition-all shrink-0"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-brand-card ${
                      node.status === 'In Office'
                        ? 'bg-emerald-400'
                        : node.status === 'Remote'
                        ? 'bg-sky-400'
                        : node.status === 'Business Travel'
                        ? 'bg-purple-400'
                        : 'bg-amber-400'
                    }`}
                    title={node.status}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-brand-ink leading-tight group-hover:text-brand-red transition-colors truncate">
                      {node.name}
                    </h4>
                    {node.tier === 'C-Suite' || node.tier === 'Director' ? (
                      <span title="Corporate Executive">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-red shrink-0" />
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs font-semibold text-brand-red mt-0.5 line-clamp-1 leading-snug">
                    {node.role}
                  </p>
                  <p className="text-[11px] text-brand-slate mt-1 flex items-center gap-1 leading-tight truncate">
                    <Building className="w-3 h-3 text-brand-slate/60 shrink-0" />
                    <span className="truncate">{node.department}</span>
                  </p>
                </div>
              </div>

              {/* Location & Performance Row */}
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-brand-slate">
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <MapPin className="w-3 h-3 text-brand-red/80 shrink-0" />
                  <span className="truncate">{node.location}</span>
                </span>
                <span className="text-emerald-400 font-bold font-mono">
                  ★ {node.performanceScore}% Score
                </span>
              </div>

              {/* Action & Subordinate Row */}
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-ink bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    <Users className="w-3 h-3 text-brand-red" />
                    {node.directReportsCount} {node.directReportsCount === 1 ? 'Direct' : 'Directs'}
                  </span>
                  {node.totalTeamSize > node.directReportsCount && (
                    <span className="text-[10px] text-brand-slate font-mono hidden sm:inline">
                      ({node.totalTeamSize} Team)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedRootId(node.id);
                      }}
                      className="p-1 rounded-md text-brand-slate hover:text-white hover:bg-white/10 text-[10px] flex items-center gap-0.5"
                      title="Drill-down to isolate this team"
                    >
                      <Compass className="w-3 h-3 text-brand-red" />
                      <span>Focus</span>
                    </button>
                  )}
                  <span className="text-brand-slate group-hover:text-brand-red text-[11px] font-semibold flex items-center gap-0.5 transition-colors">
                    Dossier <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Compact Density Card */
            <div
              className={`relative w-[250px] bg-brand-card/95 border rounded-xl p-3 shadow-card-dark transition-all duration-200 cursor-pointer backdrop-blur-md overflow-hidden ${
                isDirectMatch
                  ? 'border-brand-red ring-2 ring-brand-red/60 shadow-glow-red'
                  : `border-brand-border/80 ${accent.border} hover:-translate-y-0.5`
              }`}
            >
              <div className={`h-1 w-full absolute top-0 left-0 ${accent.bar}`} />
              <div className="flex items-center gap-2.5 pt-1">
                <div className="relative shrink-0">
                  <img
                    src={node.avatar}
                    alt={node.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-brand-border"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-1 ring-brand-card ${
                      node.status === 'In Office' ? 'bg-emerald-400' : 'bg-sky-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-brand-ink truncate group-hover:text-brand-red transition-colors">
                      {node.name}
                    </h4>
                    {node.workModality === 'Pune HQ' ? (
                      <span className="text-[8px] font-bold px-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Pune HQ
                      </span>
                    ) : node.workModality === 'Contract WFH' ? (
                      <span className="text-[8px] font-bold px-1 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
                        Contract WFH
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-brand-red font-semibold truncate leading-tight">
                    {node.role}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-brand-slate mt-1">
                    <span className="truncate">{node.department}</span>
                    <span className="font-mono text-emerald-400 font-bold">★{node.performanceScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subordinate Expand / Collapse Pill directly on the vertical stem */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-brand-card hover:bg-brand-red border border-brand-red/80 text-white text-[10px] font-bold shadow-glow-red-sm flex items-center gap-1 transition-all z-20 hover:scale-105"
              title={isExpanded ? 'Collapse sub-team' : 'Expand sub-team'}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3 h-3 text-brand-red hover:text-white" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3 h-3 text-brand-red hover:text-white" />
                  <span>{node.children!.length} Sub-teams</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Dynamic Branch Connectors & Children Rendering */}
        {hasChildren && isExpanded && (
          <div className="pt-8 relative flex flex-col items-center">
            {/* Top Stem from Parent to Horizontal Connector Line */}
            <div className="w-0.5 h-8 bg-brand-red/80 absolute top-0 pointer-events-none" />

            {/* Sibling Cards Container */}
            <div className={`flex relative ${cardDensity === 'standard' ? 'gap-8' : 'gap-5'}`}>
              {node.children!.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === node.children!.length - 1;
                const isOnly = node.children!.length === 1;

                return (
                  <div key={child.id} className="relative flex flex-col items-center pt-8">
                    {/* Horizontal Connector Line for this child's column */}
                    {!isOnly && (
                      <div className="absolute top-0 h-8 w-full pointer-events-none">
                        {/* Line extending from left edge to center (only if not first child) */}
                        {!isFirst && (
                          <div className="absolute top-0 left-0 w-1/2 h-0.5 bg-brand-border/80" />
                        )}
                        {/* Line extending from center to right edge (only if not last child) */}
                        {!isLast && (
                          <div className="absolute top-0 right-0 w-1/2 h-0.5 bg-brand-border/80" />
                        )}
                      </div>
                    )}

                    {/* Vertical drop stem from horizontal line to child card */}
                    <div className="w-0.5 h-8 bg-brand-border/80 absolute top-0 pointer-events-none" />

                    {/* Child Node */}
                    {renderNode(child)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-brand-dark p-6 overflow-y-auto' : ''}`}>
      {/* Visual Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-brand-card/90 border border-brand-border/80 backdrop-blur-md shadow-card-dark">
        {/* Left: Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search person, role, ID, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-brand-dark border border-brand-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-slate hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department Filter Selector */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-brand-dark border border-brand-border rounded-xl px-3 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
          >
            <option value="All">All Departments</option>
            <option value="DEP-ENG">Engineering & Cloud</option>
            <option value="DEP-HR">Human Resources</option>
            <option value="DEP-FIN">Finance & Payroll</option>
            <option value="DEP-SALES">Enterprise Sales</option>
          </select>

          {/* Tier Filter Selector */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-brand-dark border border-brand-border rounded-xl px-3 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
          >
            <option value="All">All Tiers</option>
            <option value="C-Suite">C-Suite (Board)</option>
            <option value="Director">Directors & VPs</option>
            <option value="Lead Architect">Lead Architects</option>
            <option value="Specialist">Specialists</option>
            <option value="Engineer">Engineers</option>
            <option value="Associate">Associates</option>
          </select>

          {/* Modality Filter Selector */}
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value as any)}
            className="bg-brand-dark border border-brand-border rounded-xl px-3 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red font-medium"
            title="Filter by workplace operating model"
          >
            <option value="All">All Modalities (HQ & WFH)</option>
            <option value="Pune HQ">🏢 Pune Global HQ</option>
            <option value="Contract WFH">💻 Contract-Based WFH</option>
          </select>

          {/* Density Switcher */}
          <div className="flex items-center rounded-xl bg-brand-dark border border-brand-border p-0.5">
            <button
              onClick={() => setCardDensity('standard')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                cardDensity === 'standard' ? 'bg-brand-red text-white' : 'text-brand-slate hover:text-white'
              }`}
              title="Standard Detailed View"
            >
              Detailed
            </button>
            <button
              onClick={() => setCardDensity('compact')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                cardDensity === 'compact' ? 'bg-brand-red text-white' : 'text-brand-slate hover:text-white'
              }`}
              title="Compact High-Density View"
            >
              Compact
            </button>
          </div>
        </div>

        {/* Right: Zoom & Canvas Actions */}
        <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-auto">
          {/* Zoom In/Out/Reset */}
          <div className="flex items-center gap-1 bg-brand-dark border border-brand-border rounded-xl p-1">
            <button
              onClick={() => setZoom((z) => Math.min(Number((z + 0.1).toFixed(1)), 1.5))}
              className="p-1.5 rounded-lg text-brand-slate hover:text-white hover:bg-white/5 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(Number((z - 0.1).toFixed(1)), 0.5))}
              className="p-1.5 rounded-lg text-brand-slate hover:text-white hover:bg-white/5 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-2 py-0.5 text-[11px] font-mono font-bold text-brand-slate hover:text-white rounded"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>

          {/* Expand / Collapse Controls */}
          <div className="flex items-center gap-1 bg-brand-dark border border-brand-border rounded-xl p-1">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-[11px] font-semibold text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseToDirectors}
              className="px-2.5 py-1 text-[11px] font-semibold text-brand-slate hover:text-white rounded-lg transition-colors hidden sm:inline"
              title="Collapse to Director level"
            >
              Directors Only
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-[11px] font-semibold text-brand-slate hover:text-white rounded-lg transition-colors"
            >
              Collapse
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-brand-dark border border-brand-border text-brand-slate hover:text-white hover:border-brand-red transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Trail when drilled into a specific branch */}
      {focusedRootId !== rootNode.id && (
        <div className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-brand-card border border-brand-red/30 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-brand-slate font-medium">Viewing Sub-tree:</span>
            {breadcrumbTrail.map((node, idx) => (
              <React.Fragment key={node.id}>
                {idx > 0 && <span className="text-brand-slate/40">/</span>}
                <button
                  onClick={() => setFocusedRootId(node.id)}
                  className={`font-semibold transition-colors ${
                    node.id === focusedRootId
                      ? 'text-brand-red font-bold underline'
                      : 'text-brand-slate hover:text-brand-ink'
                  }`}
                >
                  {node.name} ({node.role.split('&')[0].trim()})
                </button>
              </React.Fragment>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFocusedRootId(rootNode.id)}
            className="text-[11px] text-brand-red hover:text-white"
          >
            Reset to Whole Org
          </Button>
        </div>
      )}

      {/* Main Hierarchy Canvas */}
      <div 
        ref={canvasRef}
        className={`relative rounded-3xl bg-brand-card/40 border border-brand-border/80 shadow-card-dark overflow-x-auto overflow-y-auto min-h-[660px] p-6 sm:p-10 transition-all ${
          isFullscreen ? 'h-[calc(100vh-140px)]' : ''
        }`}
      >
        {/* Canvas Ambient Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Level Guides on Canvas Top-Left */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 text-[10px] text-brand-slate/50 font-mono pointer-events-none bg-brand-card/70 p-2.5 rounded-xl backdrop-blur-sm border border-white/5">
          <span>● Level 1: Executive Board</span>
          <span>● Level 2: Directors & VPs</span>
          <span>● Level 3: Lead Architects</span>
          <span>● Level 4: Senior Specialists & Engineers</span>
        </div>

        {/* Scalable Chart Root Container with Safe Padding */}
        <div className="w-max min-w-full flex justify-center py-6 px-16">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)',
            }}
            className="flex justify-center relative z-10"
          >
            {renderNode(activeRoot, true)}
          </div>
        </div>
      </div>
    </div>
  );
};
