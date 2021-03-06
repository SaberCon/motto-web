import { Card, List, Button, Icon, message, Tooltip } from 'antd';
import React, { Component } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import CreateForm from './components/CreateForm';
import styles from './style.less';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Zmage from 'react-zmage';
import { save, del } from '@/services/image';

class Image extends Component {
  state = {
    createModalVisible: false,
  };

  componentDidMount() {
    const { dispatch, resourceImage } = this.props;
    dispatch({
      type: 'resourceImage/fetchAndAppend',
      payload: {
        start: resourceImage.list ? resourceImage.list.length : 0,
        size: 11,
      },
    });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'resourceImage/reset',
    });
  }

  handleAdd = async paramsList => {
    if (!paramsList || !paramsList.length) {
      return true;
    }
    const hide = message.loading('正在添加');
    try {
      await Promise.all(paramsList.map(params => save(params)));
      hide();
      message.success('添加成功');
      const { dispatch } = this.props;
      dispatch({
        type: 'resourceImage/fetchAndPrepend',
        payload: {
          start: 0,
          size: paramsList.length,
        },
      });
      return true;
    } catch (error) {
      hide();
      message.error('添加失败请重试！');
      return false;
    }
  };

  fetchMore = () => {
    const { dispatch, resourceImage } = this.props;
    dispatch({
      type: 'resourceImage/fetchAndAppend',
      payload: {
        start: resourceImage.list ? resourceImage.list.length : 0,
        size: 12,
      },
    });
  };

  render() {
    const {
      resourceImage: { list = [], appendable },
      loading,
    } = this.props;
    const { createModalVisible } = this.state;

    const loadMore = appendable && (
      <div
        style={{
          textAlign: 'center',
          marginTop: 16,
          position: 'relative',
        }}
      >
        <Button
          onClick={this.fetchMore}
          style={{
            paddingLeft: 48,
            paddingRight: 48,
          }}
        >
          {loading ? (
            <span>
              <Icon type="loading" /> 加载中...
            </span>
          ) : (
            '加载更多'
          )}
        </Button>
      </div>
    );

    const cardList = list && (
      <List
        rowKey="id"
        loading={loading}
        loadMore={loadMore}
        grid={{
          gutter: 24,
          xl: 6,
          lg: 4,
          md: 4,
          sm: 3,
          xs: 2,
        }}
        dataSource={[{ id: 'new' }, ...list]}
        renderItem={item => {
          if (item && item.id !== 'new') {
            return (
              <List.Item>
                <Card
                  className={styles.card}
                  hoverable
                  cover={
                    <div
                      className={styles.cardImg}
                      style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
                    >
                      <span className={styles.cardActions}>
                        <Tooltip title="参看原图">
                          <Icon type="eye" onClick={() => Zmage.browsing({ src: item.url })} />
                        </Tooltip>
                        <CopyToClipboard text={item.url} onCopy={() => message.info(` ${item.name} 链接复制成功！`)}>
                          <Tooltip title="复制链接">
                            <Icon type="copy" />
                          </Tooltip>
                        </CopyToClipboard>
                        <Tooltip title="删除图片">
                          <Icon type="delete" onClick={ async () => {
                                try {
                                  const response = await del({ id: item.id });
                                  if (response.success) {
                                    message.success('删除成功');
                                    const { dispatch } = this.props;
                                    dispatch({
                                      type: 'resourceImage/delete',
                                      payload: {
                                        id: item.id,
                                      },
                                    });
                                  }
                                } catch (error) {
                                  message.error('删除失败请重试！');
                                }
                          }} />
                        </Tooltip>
                      </span>
                    </div>
                  }
                >
                  <Card.Meta
                    className={styles.cardTitle}
                    title={
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.name}
                      </a>
                    }
                  />
                  <div className={styles.cardItemContent}>
                    <span>{moment(item.createTime).fromNow()}</span>
                  </div>
                </Card>
              </List.Item>
            );
          }

          return (
            <List.Item>
              <Button
                type="dashed"
                className={styles.newButton}
                onClick={() => {
                  this.setState({ createModalVisible: true });
                }}
                ghost
              >
                <Icon type="plus" /> 新增图片
              </Button>
            </List.Item>
          );
        }}
      />
    );

    return (
      <PageHeaderWrapper>
        <div className={styles.coverCardList}>
          <div className={styles.cardList}>{cardList}</div>
        </div>

        <CreateForm
          onSubmit={async value => {
            const success = await this.handleAdd(value);
            if (success) {
              this.setState({ createModalVisible: false });
            }
          }}
          onCancel={() => {
            this.setState({ createModalVisible: false });
          }}
          modalVisible={createModalVisible}
        />
      </PageHeaderWrapper>
    );
  }
}

export default connect(({ resourceImage, loading }) => ({
  resourceImage,
  loading: loading.models.resourceImage,
}))(Image);
