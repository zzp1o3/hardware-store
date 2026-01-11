import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform, Animated, Easing, Modal, TextInput } from 'react-native';
import { getTodayOrders, getTodaySummary, deleteOrder, getOrdersByDate, getSummaryByDate } from '../database/queries';
import { on, emit } from '../utils/eventBus';
import { showToast } from '../utils/toast';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

export const StatsScreen: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const loadData = async (date?: Date) => {
    try {
      setLoading(true);
      const d = date || selectedDate;
      const dateStr = formatDate(d);
      const summary = await getSummaryByDate(dateStr);
      setTotal(Number(summary.total) || 0);
      setCount(Number(summary.count) || 0);

      const rows = await getOrdersByDate(dateStr);
      setOrders(rows || []);
    } catch (err) {
      console.error('加载统计数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = on('ordersUpdated', () => {
      loadData();
    });
    return () => {
      unsub && unsub();
    };
  }, []);

  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // Animated values per order id for long-press visual feedback
  const animMap = React.useRef<Record<number, Animated.Value>>({});
  const getAnim = (id: number) => {
    if (!animMap.current[id]) animMap.current[id] = new Animated.Value(0);
    return animMap.current[id];
  };

  const handleLongPress = (item: any) => {
    Alert.alert('删除订单', '确定要删除此订单吗？该操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        try {
          await deleteOrder(item.id);
          emit('ordersUpdated');
          showToast('订单已删除', 'success');
          await loadData();
        } catch (err) {
          console.error('删除订单失败', err);
          Alert.alert('错误', '删除订单失败');
        }
      }}
    ]);
  };

  const renderOrder = ({ item }: { item: any }) => {
    let itemsCount = 0;
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(item.items || '[]');
      itemsCount = parsed.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
    } catch (e) {
      parsed = [];
      itemsCount = 0;
    }

    const isExpanded = expandedIds.includes(item.id);

    const anim = getAnim(item.id);
    const bgColor = anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#ffffff', '#e6f0ff'],
    });
    const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

    return (
      <View>
        <AnimatedTouchable
          activeOpacity={0.8}
          onPress={() => toggleExpanded(item.id)}
          onLongPress={() => handleLongPress(item)}
          onPressIn={() => {
            Animated.timing(anim, {
              toValue: 1,
              duration: 600,
              easing: Easing.linear,
              useNativeDriver: false,
            }).start();
          }}
          onPressOut={() => {
            Animated.timing(anim, {
              toValue: 0,
              duration: 150,
              easing: Easing.linear,
              useNativeDriver: false,
            }).start();
          }}
          style={[styles.orderItem, { backgroundColor: bgColor }]}
        >
          <View style={styles.row}>
            <Text style={styles.orderId}>订单 #{item.id}</Text>
            <Text style={styles.orderAmount}>¥{Number(item.totalAmount).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.orderMeta}>{itemsCount} 件</Text>
            <Text style={styles.orderMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <Text style={styles.expandHint}>{isExpanded ? '收起 ▲' : '查看商品 ▼'}</Text>
        </AnimatedTouchable>

        {isExpanded && parsed.length > 0 && (
          <View style={styles.detailContainer}>
            {parsed.map((p, idx) => (
              <View style={styles.detailRow} key={idx}>
                <Text style={styles.detailName}>{p.name}</Text>
                <Text style={styles.detailMeta}>{p.quantity} × ¥{Number(p.price).toFixed(2)}</Text>
                <Text style={styles.detailSubtotal}>¥{(Number(p.quantity) * Number(p.price)).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // split orders into time buckets
  const splitByTime = (list: any[]) => {
    const morning: any[] = []; // 00:00 - 11:59
    const afternoon: any[] = []; // 12:00 - 17:59
    const evening: any[] = []; // 18:00 - 23:59
    for (const o of list) {
      const d = new Date(o.createdAt);
      const h = d.getHours();
      if (h < 12) morning.push(o);
      else if (h < 18) afternoon.push(o);
      else evening.push(o);
    }
    return { morning, afternoon, evening };
  };

  const onPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    loadData(d);
  };

  const onNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    loadData(d);
  };

  const openDateInput = () => {
    setDateInput(formatDate(selectedDate));
    setDateModalVisible(true);
  };

  const confirmDateInput = () => {
    // expect YYYY-MM-DD
    const v = dateInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      Alert.alert('格式错误', '请输入 YYYY-MM-DD 格式的日期');
      return;
    }
    const parts = v.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    setSelectedDate(d);
    setDateModalVisible(false);
    loadData(d);
  };

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>今日总收入</Text>
          <Text style={styles.summaryValue}>¥{total.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>订单数量</Text>
          <Text style={styles.summaryValue}>{count}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>选择日期</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={onPrevDay} style={styles.dateNav}><Text>◀</Text></TouchableOpacity>
            <TouchableOpacity onPress={openDateInput} style={{ paddingHorizontal: 8 }}>
              <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNextDay} style={styles.dateNav}><Text>▶</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <Loading text="正在加载统计..." />
      ) : orders.length === 0 ? (
        <EmptyState icon="📭" title="今天还没有订单" subtitle="暂无收入记录" />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {(() => {
            const { morning, afternoon, evening } = splitByTime(orders);
            return (
              <>
                <Text style={styles.sectionTitle}>上午（00:00 - 11:59） {morning.length ? `(${morning.length})` : ''}</Text>
                {morning.length === 0 ? <Text style={styles.emptyText}>暂无订单</Text> : morning.map(o => <View key={o.id}>{renderOrder({ item: o })}</View>)}

                <Text style={styles.sectionTitle}>下午（12:00 - 17:59） {afternoon.length ? `(${afternoon.length})` : ''}</Text>
                {afternoon.length === 0 ? <Text style={styles.emptyText}>暂无订单</Text> : afternoon.map(o => <View key={o.id}>{renderOrder({ item: o })}</View>)}

                <Text style={styles.sectionTitle}>晚上（18:00 - 23:59） {evening.length ? `(${evening.length})` : ''}</Text>
                {evening.length === 0 ? <Text style={styles.emptyText}>暂无订单</Text> : evening.map(o => <View key={o.id}>{renderOrder({ item: o })}</View>)}
              </>
            );
          })()}
        </ScrollView>
      )}

      <Modal visible={dateModalVisible} transparent animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>输入日期（YYYY-MM-DD）</Text>
            <TextInput style={styles.input} value={dateInput} onChangeText={setDateInput} placeholder="2026-01-11" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.smallButton, { marginRight: 8 }]} onPress={() => setDateModalVisible(false)}>
                <Text style={styles.smallButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={confirmDateInput}>
                <Text style={styles.smallButtonText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  summary: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: 'white', marginBottom: 8 },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { color: '#666' },
  summaryValue: { fontSize: 20, fontWeight: '700', marginTop: 6 },
  list: { flex: 1, padding: 12 },
  listContent: { paddingBottom: 120 },
  orderItem: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontWeight: '600' },
  orderAmount: { color: '#007AFF', fontWeight: '700' },
  orderMeta: { color: '#666', marginTop: 6 },
  expandHint: { color: '#007AFF', marginTop: 8, textAlign: 'right' },
  detailContainer: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detailName: { flex: 1 },
  detailMeta: { width: 120, textAlign: 'right', color: '#666' },
  detailSubtotal: { width: 80, textAlign: 'right', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999' },
  dateNav: { padding: 8, borderRadius: 6, backgroundColor: '#eee', marginHorizontal: 6 },
  sectionTitle: { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 16, borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 6, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  smallButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#007AFF', borderRadius: 6 },
  smallButtonText: { color: 'white', fontWeight: '600' },
});
